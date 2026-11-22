import { DEFAULT_PARAMS, DEFAULT_RANDOM } from './defaults';
import { generateDataset } from './generate';
import {
  CURVES,
  GROUP_COLORS,
  ROLES,
  type Applicant,
  type CurveType,
  type Group,
  type Role,
  type SimulationParams,
} from './types';
import { clamp } from './random';

export interface CalculationData {
  groups: Group[];
  applicants: Applicant[];
  params: SimulationParams;
}

export function groupRatio(nnj: number, nivelMedio: number): number {
  const total = Math.max(0, Math.round(nnj));
  const trained = Math.max(0, Math.round(nivelMedio));
  return total > 0 ? trained / total : 0;
}

export function normalizeParams(
  params: SimulationParams,
): SimulationParams {
  return {
    budget: Math.max(0, Math.round(params.budget)),
    courseCost: Math.max(0, Math.round(params.courseCost)),
    tolerance: clamp(params.tolerance, 0, 20),
    maxDiff: clamp(params.maxDiff, 0, 500),
    minRatioDiff: clamp(params.minRatioDiff, 0, 1),
    curve: CURVES.includes(params.curve) ? params.curve : DEFAULT_PARAMS.curve,
  };
}

export function nextGroupId(groups: Group[]): number {
  return groups.reduce((max, group) => Math.max(max, group.id), 0) + 1;
}

export function nextApplicantNumber(applicants: Applicant[]): number {
  let max = 0;
  for (const applicant of applicants) {
    const match = applicant.id.match(/(\d+)\s*$/);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return Math.max(max, applicants.length) + 1;
}

export function makeGroup(
  id: number,
  index: number,
  patch: Partial<Group> = {},
): Group {
  const nnj = Math.max(0, Math.round(patch.nnj ?? 25));
  const nivelMedio = Math.max(0, Math.round(patch.nivelMedio ?? 2));

  return {
    id,
    name: patch.name?.trim() || `Grupo ${String(id).padStart(2, '0')}`,
    nnj,
    nivelMedio,
    ratio: groupRatio(nnj, nivelMedio),
    regular: patch.regular ?? true,
    color: patch.color ?? GROUP_COLORS[index % GROUP_COLORS.length],
  };
}

export function makeApplicant(
  applicantNumber: number,
  groupId: number,
  patch: Partial<Applicant> = {},
): Applicant {
  const suffix = String(applicantNumber).padStart(2, '0');

  return {
    id: patch.id?.trim() || `P-${suffix}`,
    label: patch.label?.trim() || `Postulante ${suffix}`,
    groupId,
    role: patch.role ?? 'otro',
    rsh: clamp(Math.round(patch.rsh ?? 50), 0, 100),
    groupRatio: patch.groupRatio ?? 0,
  };
}

export function emptyCalculation(): CalculationData {
  return {
    groups: [],
    applicants: [],
    // En un proceso real el fondo y el costo se ingresan explícitamente.
    params: { ...DEFAULT_PARAMS, budget: 0, courseCost: 0 },
  };
}

/**
 * Datos de ejemplo para probar el modo de cálculo sin digitar una nómina
 * completa. Usa el mismo generador reproducible de la simulación.
 */
export function sampleCalculation(): CalculationData {
  const dataset = generateDataset(DEFAULT_RANDOM);
  const groups = dataset.groups.map((group) => ({
    ...group,
    ratio: groupRatio(group.nnj, group.nivelMedio),
  }));
  const ratioByGroup = new Map(groups.map((group) => [group.id, group.ratio]));
  const applicants = dataset.applicants.map((applicant) => ({
    ...applicant,
    groupRatio: ratioByGroup.get(applicant.groupId) ?? 0,
  }));

  return {
    groups,
    applicants,
    params: { ...DEFAULT_PARAMS },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function readParams(value: unknown): SimulationParams {
  const source = isRecord(value) ? value : {};
  const curve = CURVES.includes(source.curve as CurveType)
    ? (source.curve as CurveType)
    : DEFAULT_PARAMS.curve;

  return {
    budget: Math.max(0, Math.round(finiteNumber(source.budget) ?? DEFAULT_PARAMS.budget)),
    courseCost: Math.max(
      0,
      Math.round(finiteNumber(source.courseCost) ?? DEFAULT_PARAMS.courseCost),
    ),
    tolerance: clamp(
      finiteNumber(source.tolerance) ?? DEFAULT_PARAMS.tolerance,
      0,
      20,
    ),
    maxDiff: clamp(
      finiteNumber(source.maxDiff) ?? DEFAULT_PARAMS.maxDiff,
      0,
      500,
    ),
    minRatioDiff: clamp(
      finiteNumber(source.minRatioDiff) ?? DEFAULT_PARAMS.minRatioDiff,
      0,
      1,
    ),
    curve,
  };
}

/**
 * Normaliza datos guardados o importados. Devuelve null solo si el documento
 * no tiene la forma mínima esperada; las filas inválidas se descartan.
 */
export function parseCalculation(value: unknown): CalculationData | null {
  if (!isRecord(value)) return null;
  if (
    !Array.isArray(value.groups) &&
    !Array.isArray(value.applicants) &&
    !isRecord(value.params)
  ) {
    return null;
  }

  const rawGroups = Array.isArray(value.groups) ? value.groups : [];
  const rawApplicants = Array.isArray(value.applicants) ? value.applicants : [];

  const groups: Group[] = [];
  const groupIds = new Set<number>();

  for (const [index, raw] of rawGroups.entries()) {
    if (!isRecord(raw)) continue;

    const id = finiteNumber(raw.id);
    if (id === null || id <= 0 || !Number.isInteger(id) || groupIds.has(id)) {
      continue;
    }

    const nnj = Math.max(0, Math.round(finiteNumber(raw.nnj) ?? 0));
    const nivelMedio = Math.max(
      0,
      Math.round(finiteNumber(raw.nivelMedio) ?? 0),
    );
    const color =
      typeof raw.color === 'string' && raw.color.trim()
        ? raw.color
        : GROUP_COLORS[index % GROUP_COLORS.length];

    groupIds.add(id);
    groups.push({
      id,
      name:
        typeof raw.name === 'string' && raw.name.trim()
          ? raw.name.trim()
          : `Grupo ${String(id).padStart(2, '0')}`,
      nnj,
      nivelMedio,
      ratio: groupRatio(nnj, nivelMedio),
      regular: typeof raw.regular === 'boolean' ? raw.regular : true,
      color,
    });
  }

  const ratioByGroup = new Map(groups.map((group) => [group.id, group.ratio]));
  const applicants: Applicant[] = [];
  const applicantIds = new Set<string>();

  for (const [index, raw] of rawApplicants.entries()) {
    if (!isRecord(raw)) continue;

    const groupId = finiteNumber(raw.groupId);
    if (groupId === null || !groupIds.has(groupId)) continue;

    const fallbackId = `P-${String(index + 1).padStart(2, '0')}`;
    const id =
      typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fallbackId;
    if (applicantIds.has(id)) continue;

    const role = ROLES.includes(raw.role as Role)
      ? (raw.role as Role)
      : 'otro';
    const label =
      typeof raw.label === 'string' && raw.label.trim()
        ? raw.label.trim()
        : `Postulante ${String(index + 1).padStart(2, '0')}`;

    applicantIds.add(id);
    applicants.push({
      id,
      label,
      groupId,
      role,
      rsh: clamp(Math.round(finiteNumber(raw.rsh) ?? 0), 0, 100),
      groupRatio: ratioByGroup.get(groupId) ?? 0,
    });
  }

  return {
    groups,
    applicants,
    params: readParams(value.params),
  };
}
