export type Role =
  | 'responsableGrupo'
  | 'asistenteGrupo'
  | 'responsableUnidad'
  | 'otro';

export const ROLES: Role[] = [
  'responsableGrupo',
  'asistenteGrupo',
  'responsableUnidad',
  'otro',
];

export const ROLE_META: Record<
  Role,
  { label: string; short: string; rank: number; color: string; soft: string }
> = {
  responsableGrupo: {
    label: 'Responsable de Grupo',
    short: 'Resp. Grupo',
    rank: 1,
    color: '#6d28d9',
    soft: '#eee7ff',
  },
  asistenteGrupo: {
    label: 'Asistente de Grupo',
    short: 'Asist. Grupo',
    rank: 2,
    color: '#2563eb',
    soft: '#e3edff',
  },
  responsableUnidad: {
    label: 'Responsable de Unidad',
    short: 'Resp. Unidad',
    rank: 3,
    color: '#0f766e',
    soft: '#dcfaf4',
  },
  otro: {
    label: 'Otro cargo',
    short: 'Otro',
    rank: 4,
    color: '#b45309',
    soft: '#fdf0d5',
  },
};

export type CurveType = 'lineal' | 'exponencial' | 'logaritmica' | 'acelerada';

export const CURVES: CurveType[] = [
  'lineal',
  'exponencial',
  'logaritmica',
  'acelerada',
];

export const CURVE_META: Record<
  CurveType,
  { label: string; description: string }
> = {
  lineal: {
    label: 'Lineal',
    description: 'Descenso parejo entre el primer y el último puesto.',
  },
  exponencial: {
    label: 'Exponencial',
    description: 'Pierde monto rápido al inicio y luego se estabiliza.',
  },
  logaritmica: {
    label: 'Logarítmica',
    description: 'Caída muy marcada al inicio, más suave hacia el final.',
  },
  acelerada: {
    label: 'Acelerada',
    description: 'Protege la cabeza del ranking y castiga la cola.',
  },
};

export interface RoleWeights {
  responsableGrupo: number;
  asistenteGrupo: number;
  responsableUnidad: number;
  otro: number;
}

export interface RandomConfig {
  seed: number;
  nnjMin: number;
  nnjMax: number;
  nivelMedioMin: number;
  nivelMedioMax: number;
  applicantsMin: number;
  applicantsMax: number;
  rshMin: number;
  rshMax: number;
  rshConcentration: number;
  irregularChance: number;
  roleWeights: RoleWeights;
}

export interface Group {
  id: number;
  name: string;
  nnj: number;
  nivelMedio: number;
  ratio: number;
  regular: boolean;
  color: string;
}

export interface Applicant {
  id: string;
  label: string;
  groupId: number;
  role: Role;
  rsh: number;
  groupRatio: number;
}

export interface Dataset {
  groups: Group[];
  applicants: Applicant[];
}

export interface SimulationParams {
  tolerance: number;
  maxDiff: number;
  curve: CurveType;
  minRatioDiff: number;
  budget: number;
  courseCost: number;
}

export interface RankedApplicant {
  applicant: Applicant;
  position: number;
  bucketIndex: number;
  tieId: string | null;
  tieSize: number;
}

export interface Bucket {
  index: number;
  start: number;
  end: number;
  members: RankedApplicant[];
  hasTie: boolean;
}

export interface RankingResult {
  ranked: RankedApplicant[];
  buckets: Bucket[];
}

export interface TieGroupResult {
  id: string;
  amount: number;
  members: RankedApplicant[];
}

export interface AllocationResult {
  amounts: number[];
  totalRequested: number;
  totalAssigned: number;
  budget: number;
  remaining: number;
  coverage: number;
  caseA: boolean;
  spread: number | null;
  tieGroups: TieGroupResult[];
}

export interface GroupSummary {
  group: Group;
  applicantCount: number;
  admissibleCount: number;
  allocatedCount: number;
  allocatedTotal: number;
}

export const GROUP_COLORS = [
  '#6d28d9',
  '#0f766e',
  '#b45309',
  '#2563eb',
  '#be123c',
  '#4d7c0f',
  '#7e22ce',
  '#0e7490',
  '#c2410c',
  '#4338ca',
];
