import { allocate, summarizeByGroup } from './allocation';
import { buildRanking } from './ranking';
import type {
  AllocationResult,
  Applicant,
  Bucket,
  Group,
  GroupSummary,
  RankedApplicant,
  SimulationParams,
} from './types';

export interface SimulationView {
  groups: Group[];
  applicants: Applicant[];
  admissible: Applicant[];
  excluded: Applicant[];
  ranked: RankedApplicant[];
  buckets: Bucket[];
  allocation: AllocationResult;
  summaries: GroupSummary[];
  totalNnj: number;
  totalNivelMedio: number;
  districtRatio: number;
  regularGroups: number;
}

export function buildSimulation(
  rawGroups: Group[],
  applicants: Applicant[],
  params: SimulationParams,
): SimulationView {
  // El ratio siempre se deriva de la dotación vigente del Grupo. Así, al editar
  // NNJ o Nivel Medio en el modo de cálculo, el ranking se actualiza solo.
  const groups = rawGroups.map((group) => ({
    ...group,
    ratio: group.nnj > 0 ? group.nivelMedio / group.nnj : 0,
  }));
  const ratioByGroup = new Map(groups.map((group) => [group.id, group.ratio]));
  const normalizedApplicants = applicants.map((applicant) => ({
    ...applicant,
    groupRatio: ratioByGroup.get(applicant.groupId) ?? 0,
  }));

  const regularGroupIds = new Set(
    groups.filter((group) => group.regular).map((group) => group.id),
  );
  const admissible = normalizedApplicants.filter((applicant) =>
    regularGroupIds.has(applicant.groupId),
  );
  const excluded = normalizedApplicants.filter(
    (applicant) => !regularGroupIds.has(applicant.groupId),
  );

  const ranking = buildRanking(
    admissible,
    params.tolerance,
    params.minRatioDiff,
  );
  const allocation = allocate(
    ranking.ranked,
    params.budget,
    params.courseCost,
    params.maxDiff,
    params.curve,
  );
  const summaries = summarizeByGroup(
    groups,
    normalizedApplicants,
    ranking.ranked,
    allocation.amounts,
  );

  const totalNnj = groups.reduce((sum, group) => sum + group.nnj, 0);
  const totalNivelMedio = groups.reduce(
    (sum, group) => sum + group.nivelMedio,
    0,
  );

  return {
    groups,
    applicants: normalizedApplicants,
    admissible,
    excluded,
    ranked: ranking.ranked,
    buckets: ranking.buckets,
    allocation,
    summaries,
    totalNnj,
    totalNivelMedio,
    districtRatio: totalNnj > 0 ? totalNivelMedio / totalNnj : 0,
    regularGroups: groups.filter((group) => group.regular).length,
  };
}
