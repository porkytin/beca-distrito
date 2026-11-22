import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  formatCLP,
  formatDecimal,
  formatNumber,
  formatPercent,
  formatRatio,
  formatShortDate,
} from '../domain/format';
import {
  CURVE_META,
  ROLE_META,
  type SimulationParams,
} from '../domain/types';
import type { SimulationView } from '../domain/simulation';

type ReportMode = 'simulation' | 'calculation';

interface ReportInput {
  simulation: SimulationView;
  params: SimulationParams;
  generatedAt?: Date;
  mode?: ReportMode;
  seed?: number;
}

const INK = '#1c2733';
const ACCENT = '#1f4e79';
const ACCENT_SOFT = '#eaf1f7';
const AMBER = '#a15c00';
const GREEN = '#1f6b45';
const ROSE = '#a3243b';
const MUTED = '#6b7785';
const LINE = '#dde3e9';
const PAPER = '#f7f9fb';
const WHITE = '#ffffff';

type Doc = jsPDF;

function sectionTitle(doc: Doc, text: string, y: number, accent = ACCENT) {
  doc.setFillColor(accent);
  doc.roundedRect(44, y - 7, 4, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(INK);
  doc.text(text, 56, y + 3);
}

function metricCard(
  doc: Doc,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  hint: string,
  accent: string,
) {
  doc.setFillColor(PAPER);
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, width, 58, 6, 6, 'FD');
  doc.setFillColor(accent);
  doc.roundedRect(x, y, 3, 58, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(MUTED);
  doc.text(label.toUpperCase(), x + 10, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(INK);
  doc.text(value, x + 10, y + 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(MUTED);
  doc.text(hint, x + 10, y + 47);
}

function parameterRow(
  doc: Doc,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(MUTED);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.6);
  doc.setTextColor(INK);
  doc.text(value, x + width, y, { align: 'right' });
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.4);
  doc.line(x, y + 3.5, x + width, y + 3.5);
}

function drawHeader(
  doc: Doc,
  mode: ReportMode,
  seed: number,
  generatedAt: Date,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(INK);
  doc.rect(0, 0, pageWidth, 116, 'F');

  doc.setFillColor(AMBER);
  doc.circle(pageWidth - 72, 46, 20, 'F');
  doc.setFillColor(INK);
  doc.circle(pageWidth - 72, 46, 14, 'F');
  doc.setFillColor(AMBER);
  doc.circle(pageWidth - 72, 46, 6, 'F');

  doc.setTextColor(WHITE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('DISTRITO · COMISIÓN DE BECAS', 44, 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(
    mode === 'calculation' ? 'Cálculo de asignación' : 'Informe de simulación',
    44,
    62,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#dce4ea');
  doc.text('Sistema de Becas de Formación', 44, 78);

  doc.setFontSize(7.8);
  doc.text(
    mode === 'calculation'
      ? 'Datos ingresados por la Comisión de Becas'
      : `Escenario N° ${seed}`,
    44,
    97,
  );
  doc.text(`Generado el ${formatShortDate(generatedAt)}`, pageWidth - 44, 97, {
    align: 'right',
  });

  doc.setFillColor(AMBER);
  doc.roundedRect(44, 106, 42, 3, 1.5, 1.5, 'F');
}

function drawFooter(doc: Doc, mode: ReportMode, seed: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.6);
    doc.line(44, pageHeight - 40, pageWidth - 44, pageHeight - 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    doc.text(
      'Sistema de Becas de Formación · Documento generado automáticamente',
      44,
      pageHeight - 27,
    );
    doc.text(`Página ${page} de ${pages}`, pageWidth - 44, pageHeight - 27, {
      align: 'right',
    });
    if (page > 1) {
      doc.setFontSize(7.4);
      doc.setTextColor(MUTED);
      doc.text(
        mode === 'calculation' ? 'Cálculo de asignación' : `Escenario N° ${seed}`,
        44,
        24,
      );
      doc.setDrawColor(LINE);
      doc.line(44, 30, pageWidth - 44, 30);
    }
  }
}

export function buildReport({
  simulation,
  params,
  generatedAt = new Date(),
  mode = 'simulation',
  seed = 0,
}: ReportInput): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  const { allocation, ranked, groups, summaries } = simulation;
  const roleCounts = Object.fromEntries(
    Object.keys(ROLE_META).map((role) => [
      role,
      ranked.filter((member) => member.applicant.role === role).length,
    ]),
  ) as Record<keyof typeof ROLE_META, number>;
  const tieGroups = new Set(
    ranked
      .map((member) => member.tieId)
      .filter((id): id is string => id !== null),
  );
  const noDemand = ranked.length === 0;
  const coverage = allocation.totalRequested
    ? Math.min(100, allocation.coverage * 100)
    : 0;

  drawHeader(doc, mode, seed, generatedAt);

  // Métricas principales
  const gap = 10;
  const cardWidth = (contentWidth - gap * 3) / 4;
  metricCard(
    doc,
    margin,
    132,
    cardWidth,
    'Fondo disponible',
    formatCLP(params.budget),
    mode === 'calculation' ? 'Monto ingresado' : 'Aprobado por la Asamblea',
    ACCENT,
  );
  metricCard(
    doc,
    margin + (cardWidth + gap),
    132,
    cardWidth,
    'Demanda admisible',
    formatCLP(allocation.totalRequested),
    `${ranked.length} ${
      ranked.length === 1 ? 'postulante' : 'postulantes'
    } × ${formatCLP(params.courseCost)}`,
    AMBER,
  );
  metricCard(
    doc,
    margin + (cardWidth + gap) * 2,
    132,
    cardWidth,
    'Monto asignado',
    formatCLP(allocation.totalAssigned),
    `${formatPercent(coverage, 0)} de cobertura`,
    GREEN,
  );
  metricCard(
    doc,
    margin + (cardWidth + gap) * 3,
    132,
    cardWidth,
    'Postulaciones',
    `${ranked.length} / ${simulation.applicants.length}`,
    `${simulation.groups.length - simulation.regularGroups} Grupos irregulares`,
    ROSE,
  );

  // Curva de asignación
  sectionTitle(doc, 'Distribución del monto por puesto del ranking', 218);
  const chartTop = 244;
  const chartHeight = 104;
  const chartBottom = chartTop + chartHeight;

  doc.setDrawColor(LINE);
  doc.setLineWidth(0.6);
  doc.line(margin, chartBottom, margin + contentWidth, chartBottom);

  if (ranked.length > 0) {
    const chartWidth = contentWidth;
    const maxAmount = Math.max(params.courseCost, 1);
    const barGap = ranked.length > 24 ? 1.2 : 2.4;
    const barWidth = Math.max(
      1,
      (chartWidth - barGap * (ranked.length - 1)) / ranked.length,
    );

    ranked.forEach((member, index) => {
      const amount = allocation.amounts[index] ?? 0;
      const height = Math.max(0, (amount / maxAmount) * chartHeight);
      const x = margin + index * (barWidth + barGap);
      doc.setFillColor(ROLE_META[member.applicant.role].color);
      doc.roundedRect(x, chartBottom - height, barWidth, height, 1.2, 1.2, 'F');
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(MUTED);
    doc.text('1° puesto', margin, chartBottom + 12);
    doc.text(
      `${ranked.length}° puesto`,
      margin + contentWidth,
      chartBottom + 12,
      { align: 'right' },
    );

    // Leyenda de cargos
    let legendX = margin;
    const legendY = chartBottom + 27;
    (Object.keys(ROLE_META) as (keyof typeof ROLE_META)[]).forEach((role) => {
      doc.setFillColor(ROLE_META[role].color);
      doc.circle(legendX + 2.5, legendY - 2.5, 2.5, 'F');
      doc.setTextColor(MUTED);
      doc.setFontSize(6.8);
      doc.text(
        `${ROLE_META[role].short} · ${roleCounts[role]}`,
        legendX + 8,
        legendY,
      );
      legendX += 105;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    doc.text(
      'No hay postulantes admisibles para representar en el gráfico.',
      margin,
      chartTop + 38,
    );
  }

  // Parámetros
  sectionTitle(
    doc,
    mode === 'calculation' ? 'Parámetros utilizados' : 'Parámetros del modelo',
    400,
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(MUTED);
  doc.text(
    mode === 'calculation'
      ? 'Valores ingresados para el cálculo · Vigencia sujeta a ratificación de la Asamblea'
      : 'Propuesta de la Comisión de Becas · ratificada por la Asamblea de Distrito',
    margin + contentWidth,
    403,
    { align: 'right' },
  );
  const colWidth = (contentWidth - 28) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 28;
  const paramsLeft: [string, string][] = [
    ['Tolerancia RSH', `${formatDecimal(params.tolerance, 1)} pp`],
    ['Diferencia relativa máxima', formatPercent(params.maxDiff, 0)],
    ['Tendencia de la curva', CURVE_META[params.curve].label],
  ];
  const paramsRight: [string, string][] = [
    [
      'Diferencia mínima de ratio',
      `${formatDecimal(params.minRatioDiff, 3)} (1 NM cada ${
        params.minRatioDiff > 0
          ? Math.round(1 / params.minRatioDiff)
          : '—'
      } NNJ)`,
    ],
    ['Fondo de becas', formatCLP(params.budget)],
    ['Costo del Curso Medio', formatCLP(params.courseCost)],
  ];

  paramsLeft.forEach(([label, value], index) => {
    parameterRow(doc, leftX, 428 + index * 21, colWidth, label, value);
  });
  paramsRight.forEach(([label, value], index) => {
    parameterRow(doc, rightX, 428 + index * 21, colWidth, label, value);
  });

  // Resultado
  const resultY = 500;
  doc.setFillColor(ACCENT_SOFT);
  doc.setDrawColor('#dde3e9');
  doc.roundedRect(margin, resultY, contentWidth, 52, 6, 6, 'FD');

  doc.setFillColor(noDemand ? ROSE : allocation.caseA ? GREEN : AMBER);
  doc.roundedRect(margin + 12, resultY + 11, 5, 30, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(INK);
  doc.text(
    noDemand
      ? 'Sin demanda admisible · No hay postulantes en Grupos regulares'
      : allocation.caseA
        ? 'Caso A · El fondo cubre el 100% de la demanda admisible'
        : 'Caso B · El fondo se distribuye con la curva de asignación',
    margin + 26,
    resultY + 18,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(MUTED);
  doc.text(
    noDemand
      ? `El fondo de ${formatCLP(params.budget)} queda sin asignar. Revisa la regularidad de los Grupos o los datos de postulación.`
      : allocation.caseA
        ? `Sobrante: ${formatCLP(allocation.remaining)}. Todos reciben el costo completo del curso.`
        : `Cobertura: ${formatPercent(coverage, 0)} · Brecha real entre el 1° y el último: ${
            allocation.spread === null
              ? '—'
              : formatPercent(allocation.spread, 0)
          } · Empates técnicos: ${tieGroups.size}`,
    margin + 26,
    resultY + 32,
  );

  doc.setFontSize(6.8);
  doc.text(
    `Postulaciones excluidas por regularidad: ${simulation.excluded.length} · Grupos regulares: ${simulation.regularGroups} de ${groups.length}`,
    margin + 26,
    resultY + 43,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(MUTED);
  const note = doc.splitTextToSize(
    mode === 'calculation'
      ? 'Los datos fueron ingresados por la Comisión de Becas y se procesaron localmente en el navegador. El percentil RSH se interpreta de 0 a 100, donde un valor menor representa mayor vulnerabilidad socioeconómica. Los montos se expresan en pesos chilenos (CLP). Este documento no constituye por sí solo una adjudicación oficial.'
      : 'Los datos de este informe son ficticios y se generaron localmente para revisar el mecanismo. El percentil RSH se interpreta de 0 a 100, donde un valor menor representa mayor vulnerabilidad socioeconómica. Los montos se expresan en pesos chilenos (CLP).',
    contentWidth,
  );
  doc.text(note, margin, 578);

  // Página 2: ranking y asignación
  doc.addPage();
  sectionTitle(doc, 'Ranking definitivo y asignación por postulante', 48);

  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const rankingRows = ranked.map((member) => [
    String(member.position),
    member.applicant.label,
    groupMap.get(member.applicant.groupId)?.name ?? '—',
    ROLE_META[member.applicant.role].label,
    String(member.applicant.rsh),
    formatRatio(member.applicant.groupRatio),
    member.tieId ? 'Sí' : '—',
    formatCLP(allocation.amounts[member.position - 1] ?? 0),
  ]);

  autoTable(doc, {
    startY: 66,
    head: [
      [
        'Puesto',
        'Postulante',
        'Grupo',
        'Cargo',
        'RSH',
        'Ratio',
        'Empate',
        'Monto',
      ],
    ],
    body:
      rankingRows.length > 0
        ? rankingRows
        : [['—', 'Sin postulantes admisibles', '', '', '', '', '', '']],
    foot: [
      [
        '',
        '',
        '',
        '',
        '',
        '',
        'Total',
        formatCLP(allocation.totalAssigned),
      ],
    ],
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 3.4,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: [31, 78, 121],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.2,
    },
    footStyles: {
      fillColor: [234, 241, 247],
      textColor: INK,
      fontStyle: 'bold',
      fontSize: 7.6,
    },
    alternateRowStyles: {
      fillColor: [247, 249, 251],
    },
    columnStyles: {
      0: { cellWidth: 34, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 34, halign: 'right' },
      6: { cellWidth: 40, halign: 'center' },
      7: { cellWidth: 67, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.section === 'body' && data.column.index === 6 && data.cell.text[0] === 'Sí') {
        data.cell.styles.textColor = [161, 92, 0];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Dotación por Grupo
  let groupTableY =
    ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 500) + 34;

  if (groupTableY > pageHeight - 150) {
    doc.addPage();
    groupTableY = 48;
  }

  sectionTitle(doc, 'Dotación y resultado por Grupo', groupTableY);
  const groupRows = summaries.map((summary) => [
    summary.group.name,
    formatNumber(summary.group.nnj),
    formatNumber(summary.group.nivelMedio),
    formatRatio(summary.group.ratio),
    summary.group.regular ? 'Regular' : 'Irregular',
    String(summary.applicantCount),
    String(summary.allocatedCount),
    formatCLP(summary.allocatedTotal),
  ]);

  autoTable(doc, {
    startY: groupTableY + 16,
    head: [
      [
        'Grupo',
        'NNJ',
        'Nivel Medio',
        'Ratio',
        'Regularidad',
        'Postulantes',
        'Becas',
        'Asignado',
      ],
    ],
    body: groupRows,
    foot: [
      [
        'Total',
        formatNumber(simulation.totalNnj),
        formatNumber(simulation.totalNivelMedio),
        formatRatio(simulation.districtRatio),
        '',
        String(simulation.applicants.length),
        String(ranked.filter((_, index) => (allocation.amounts[index] ?? 0) > 0).length),
        formatCLP(allocation.totalAssigned),
      ],
    ],
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 7.4,
      cellPadding: 4,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: [28, 39, 51],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.2,
    },
    footStyles: {
      fillColor: [234, 241, 247],
      textColor: INK,
      fontStyle: 'bold',
      fontSize: 7.4,
    },
    alternateRowStyles: {
      fillColor: [247, 249, 251],
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor =
          data.cell.text[0] === 'Regular' ? [31, 107, 69] : [163, 36, 59];
      }
    },
  });

  // Notas finales
  const finalY =
    ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 700) + 28;
  let noteY = finalY;
  if (noteY > pageHeight - 90) {
    doc.addPage();
    noteY = 52;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(INK);
  doc.text('Nota metodológica', margin, noteY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(MUTED);
  const methodology = doc.splitTextToSize(
    'El ranking se construye primero agrupando por percentil RSH dentro de la tolerancia configurada. Dentro de cada balde se ordena por cargo, luego por el ratio de Nivel Medio por NNJ del Grupo y, si la diferencia es menor al umbral, se declara empate técnico. La asignación reparte el fondo según la curva y la diferencia relativa máxima; los empates técnicos reciben exactamente el mismo monto. Este documento no constituye una adjudicación oficial.',
    contentWidth,
  );
  doc.text(methodology, margin, noteY + 14);

  drawFooter(doc, mode, seed);
  return doc;
}

export function downloadReport(input: ReportInput): void {
  const doc = buildReport(input);
  const generatedAt = input.generatedAt ?? new Date();
  const mode = input.mode ?? 'simulation';
  const date = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(generatedAt);
  doc.save(
    mode === 'calculation'
      ? `calculo-becas-${date}.pdf`
      : `simulacion-becas-${input.seed ?? 0}-${date}.pdf`,
  );
}
