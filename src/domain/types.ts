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
    color: '#1f4e79',
    soft: '#eaf1f7',
  },
  asistenteGrupo: {
    label: 'Asistente de Grupo',
    short: 'Asist. Grupo',
    rank: 2,
    color: '#2f6f8f',
    soft: '#e8f3f7',
  },
  responsableUnidad: {
    label: 'Responsable de Unidad',
    short: 'Resp. Unidad',
    rank: 3,
    color: '#1f6b5c',
    soft: '#e8f4f1',
  },
  otro: {
    label: 'Otro cargo',
    short: 'Otro',
    rank: 4,
    color: '#8a5a1f',
    soft: '#f7f0e6',
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
  '#1f4e79',
  '#1f6b5c',
  '#8a5a1f',
  '#4a6d8c',
  '#8c3b4a',
  '#5a6b35',
  '#3f5f7f',
  '#2f6f7f',
  '#7a5230',
  '#4a5578',
];
