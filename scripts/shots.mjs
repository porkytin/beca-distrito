import { chromium } from 'playwright-core';
import fs from 'node:fs';

const outDir = '/tmp/opencode/shots2';
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

for (let index = 0; index <= 9; index += 1) {
  await page.goto(`http://localhost:5173/#paso-${index}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${outDir}/step${index}.png` });
  if (index >= 5) {
    await page.screenshot({
      path: `${outDir}/step${index}-full.png`,
      fullPage: true,
    });
  }
  console.log(`captured ${index}`);
}

// Interacción: cambiar la curva en Parámetros.
await page.goto('http://localhost:5173/#paso-5', {
  waitUntil: 'domcontentloaded',
});
await page.waitForTimeout(900);
await page.getByRole('button', { name: /Exponencial/ }).click();
await page.waitForTimeout(900);
const selectedCurve = await page
  .getByRole('button', { name: /Exponencial/ })
  .getAttribute('aria-pressed');
await page.screenshot({ path: `${outDir}/interaction-curve.png` });

// Interacción: cambiar regularidad de un Grupo.
await page.goto('http://localhost:5173/#paso-4', {
  waitUntil: 'domcontentloaded',
});
await page.waitForTimeout(900);
const switchBefore = await page.locator('.group-state-card').first().getAttribute('class');
await page.locator('.group-state-card .switch').first().click();
await page.waitForTimeout(700);
const switchAfter = await page.locator('.group-state-card').first().getAttribute('class');
await page.screenshot({ path: `${outDir}/interaction-regularity.png` });

// Descarga del PDF.
await page.goto('http://localhost:5173/#paso-9', {
  waitUntil: 'domcontentloaded',
});
await page.waitForTimeout(900);
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: /Descargar PDF/i }).click();
const download = await downloadPromise;
const pdfPath = `${outDir}/reporte.pdf`;
await download.saveAs(pdfPath);
const pdfSize = fs.statSync(pdfPath).size;

// Vista móvil.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
for (const index of [0, 1, 3, 5, 8, 9]) {
  await mobile.goto(`http://localhost:5173/#paso-${index}`, {
    waitUntil: 'domcontentloaded',
  });
  await mobile.waitForTimeout(1400);
  await mobile.screenshot({ path: `${outDir}/mobile${index}.png` });
}

console.log(
  JSON.stringify(
    {
      selectedCurve,
      regularityChanged: switchBefore !== switchAfter,
      pdfSize,
      errors,
    },
    null,
    2,
  ),
);

await browser.close();
