import { formatRatio } from '../domain/format';
import type { SimulationView } from '../domain/simulation';
import { ROLE_META } from '../domain/types';

function escapeCell(value: string | number): string {
  const raw = String(value);
  // Evita que una celda de texto se interprete como fórmula al abrir el CSV.
  const text = /^[=+@-]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildRankingCsv(simulation: SimulationView): string {
  const groupMap = new Map(
    simulation.groups.map((group) => [group.id, group]),
  );
  const rows = [
    [
      'Puesto',
      'Postulante',
      'Grupo',
      'Cargo',
      'RSH',
      'Balde',
      'Ratio',
      'Empate',
      'Monto CLP',
    ],
    ...simulation.ranked.map((member, index) => [
      member.position,
      member.applicant.label,
      groupMap.get(member.applicant.groupId)?.name ?? '',
      ROLE_META[member.applicant.role].label,
      member.applicant.rsh,
      member.bucketIndex + 1,
      formatRatio(member.applicant.groupRatio),
      member.tieId ? 'Sí' : 'No',
      Math.round(simulation.allocation.amounts[index] ?? 0),
    ]),
  ];

  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadRankingCsv(simulation: SimulationView): void {
  const csv = buildRankingCsv(simulation);
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `becas-calculo-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
