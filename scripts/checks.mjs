import { chromium } from 'playwright-core';
import fs from 'node:fs';

const outDir = '/tmp/opencode/checks';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

// 1) Forzar empates técnicos con tolerancia y umbral máximos.
await page.goto('http://localhost:5173/?case=ties#simulacion/5', {
  waitUntil: 'domcontentloaded',
});
await page.waitForTimeout(1200);

const tolerance = page.getByLabel('Tolerancia de empate socioeconómico');
await tolerance.focus();
await page.keyboard.press('End');
const ratioThreshold = page.getByLabel(
  'Diferencia mínima de ratio Nivel Medio / NNJ',
);
await ratioThreshold.focus();
await page.keyboard.press('End');
await page.waitForTimeout(600);

await page.getByRole('button', { name: 'Asignación', exact: true }).click();
await page.waitForTimeout(1800);

const tieGroups = await page.locator('.tie-group').count();
const stats = await page.locator('.alloc-stats .stat-value').allTextContents();
const tieAmounts = await page
  .locator('.tie-group-head strong')
  .allTextContents();
await page.screenshot({ path: `${outDir}/ties.png` });

await page.getByRole('button', { name: 'Reporte', exact: true }).click();
await page.waitForTimeout(700);
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: /Descargar PDF/i }).click();
const download = await downloadPromise;
await download.saveAs(`${outDir}/ties.pdf`);

// 2) Todos los Grupos irregulares: no debe romper el reporte.
const emptyPage = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
});
await emptyPage.goto('http://localhost:5173/?case=empty#simulacion/4', {
  waitUntil: 'domcontentloaded',
});
await emptyPage.waitForTimeout(900);
let guard = 0;
while ((await emptyPage.locator('.switch.is-on').count()) > 0 && guard < 12) {
  await emptyPage.locator('.switch.is-on').first().click();
  await emptyPage.waitForTimeout(80);
  guard += 1;
}
await emptyPage.waitForTimeout(500);
const admissibleAfter = await emptyPage
  .locator('.regularity-stats .stat-value')
  .allTextContents();
await emptyPage.getByRole('button', { name: 'Reporte', exact: true }).click();
await emptyPage.waitForTimeout(600);
const emptyDownloadPromise = emptyPage.waitForEvent('download');
await emptyPage.getByRole('button', { name: /Descargar PDF/i }).click();
const emptyDownload = await emptyDownloadPromise;
await emptyDownload.saveAs(`${outDir}/empty.pdf`);
await emptyPage.screenshot({ path: `${outDir}/empty-report-page.png` });

// 3) Móvil actualizado.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
for (const index of [0, 8, 9]) {
  await mobile.goto(`http://localhost:5173/?mobile=${index}#simulacion/${index}`, {
    waitUntil: 'domcontentloaded',
  });
  await mobile.waitForTimeout(1600);
  await mobile.screenshot({ path: `${outDir}/mobile${index}.png` });
}
const stepCount = await mobile.locator('.step').count();
const lastStepBox = await mobile.locator('.step').last().boundingBox();
const viewport = mobile.viewportSize();

// 4) Parámetros con empate.
await page.screenshot({ path: `${outDir}/final-params.png` });

// 5) Campos numéricos: escritura dígito a dígito, limpieza y ceros iniciales.
const inputPage = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
});
await inputPage.goto('http://localhost:5173/?case=inputs#simulacion/3', {
  waitUntil: 'domcontentloaded',
});
await inputPage.waitForTimeout(900);
const courseCost = inputPage.getByLabel('Costo del Curso Medio');
await courseCost.click();
for (const digit of '150000') {
  await courseCost.press(digit);
}
const costWhileTyping = await courseCost.inputValue();
await courseCost.blur();
const costAfterBlur = await courseCost.inputValue();

await inputPage.goto('http://localhost:5173/?case=inputs#simulacion/1', {
  waitUntil: 'domcontentloaded',
});
await inputPage.waitForTimeout(800);
const seedInput = inputPage.getByLabel('Semilla del escenario');
await seedInput.click();
await seedInput.press('Control+a');
await seedInput.press('Backspace');
const seedWhileEmpty = await seedInput.inputValue();
await seedInput.blur();
const seedAfterBlur = await seedInput.inputValue();

await seedInput.click();
await seedInput.press('Control+a');
await seedInput.press('0');
await seedInput.press('5');
const seedLeadingZero = await seedInput.inputValue();
await seedInput.blur();
const seedAfterLeadingZero = await seedInput.inputValue();

// 6) Modo de cálculo: alta manual, resultado y documentos.
const calcPage = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
});
calcPage.on('pageerror', (error) =>
  errors.push(`calc pageerror: ${error.message}`),
);
await calcPage.goto('http://localhost:5173/#calculo/datos', {
  waitUntil: 'domcontentloaded',
});
await calcPage.evaluate(() => localStorage.clear());
await calcPage.reload({ waitUntil: 'domcontentloaded' });
await calcPage.waitForTimeout(500);

await calcPage.getByRole('button', { name: 'Agregar Grupo' }).click();
await calcPage.getByLabel('Nombre del Grupo 1').fill('Grupo Los Robles');
await calcPage.getByLabel('NNJ de Grupo Los Robles').fill('40');
await calcPage.getByLabel('Nivel Medio de Grupo Los Robles').fill('2');
await calcPage.getByRole('button', { name: 'Agregar postulación' }).click();
await calcPage.getByLabel('Nombre de P-01').fill('Ana Pérez');
await calcPage.getByLabel('Cargo de Ana Pérez').selectOption('responsableGrupo');
await calcPage.getByLabel('RSH de Ana Pérez').fill('12');

await calcPage.getByRole('tab', { name: 'Parámetros' }).click();
await calcPage.waitForTimeout(300);
await calcPage.getByLabel('Fondo anual de becas').fill('100000');
await calcPage.getByLabel('Costo del Curso Medio').fill('250000');
await calcPage.getByRole('tab', { name: 'Resultado' }).click();
await calcPage.waitForTimeout(500);

const calcRows = await calcPage.locator('.result-table tbody tr').count();
const calcAmount = await calcPage
  .locator('.result-table tbody tr .amount-cell')
  .first()
  .textContent();
const calcCoverage = await calcPage
  .locator('.calc-summary strong')
  .last()
  .textContent();

const calcPdfPromise = calcPage.waitForEvent('download');
await calcPage.getByRole('button', { name: 'Descargar PDF' }).click();
const calcPdf = await calcPdfPromise;
await calcPdf.saveAs(`${outDir}/calculo.pdf`);

const calcCsvPromise = calcPage.waitForEvent('download');
await calcPage.getByRole('button', { name: 'Exportar CSV' }).click();
const calcCsv = await calcCsvPromise;
await calcCsv.saveAs(`${outDir}/nomina.csv`);

await calcPage.reload({ waitUntil: 'domcontentloaded' });
await calcPage.waitForTimeout(500);
await calcPage.getByRole('tab', { name: /Datos/ }).click();
await calcPage.waitForTimeout(300);
const persistedGroup = await calcPage
  .locator('.editor-table')
  .first()
  .locator('tbody tr td input')
  .first()
  .inputValue();

console.log(
  JSON.stringify(
    {
      tieGroups,
      tieAmounts: tieAmounts.slice(0, 4),
      stats,
      admissibleAfter,
      stepCount,
      lastStepBox,
      viewport,
      errors,
      numericInputs: {
        costWhileTyping,
        costAfterBlur,
        seedWhileEmpty,
        seedAfterBlur,
        seedLeadingZero,
        seedAfterLeadingZero,
      },
      calculation: {
        calcRows,
        calcAmount,
        calcCoverage,
        persistedGroup,
        pdfSize: fs.statSync(`${outDir}/calculo.pdf`).size,
        csvSize: fs.statSync(`${outDir}/nomina.csv`).size,
      },
      pdfSizes: {
        ties: fs.statSync(`${outDir}/ties.pdf`).size,
        empty: fs.statSync(`${outDir}/empty.pdf`).size,
      },
    },
    null,
    2,
  ),
);

await browser.close();
