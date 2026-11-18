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
  groups: Group[],
  applicants: Applicant[],
  params: SimulationParams,
): SimulationView {
  const regularGroupIds = new Set(
    groups.filter((group) => group.regular).map((group) => group.id),
  );
  const admissible = applicants.filter((applicant) =>
    regularGroupIds.has(applicant.groupId),
  );
  const excluded = applicants.filter(
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
    applicants,
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
    applicants,
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
