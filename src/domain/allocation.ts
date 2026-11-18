import {
  type Applicant,
  type AllocationResult,
  type CurveType,
  type Group,
  type GroupSummary,
  type RankedApplicant,
  type TieGroupResult,
} from './types';

/**
 * Forma de la curva de asignación.
 * h(0) = 1 y h(1) = r, donde r = 1 / (1 + diferencia relativa máxima).
 */
export function curveShape(type: CurveType, x: number, r: number): number {
  const t = Math.min(1, Math.max(0, x));
  switch (type) {
    case 'lineal':
      return 1 - (1 - r) * t;
    case 'exponencial':
      return Math.pow(r, t);
    case 'logaritmica':
      return 1 - (1 - r) * Math.log(1 + (Math.E - 1) * t);
    case 'acelerada':
      return 1 - (1 - r) * t * t;
  }
}

export function curveRatio(maxDiff: number): number {
  return 1 / (1 + Math.max(0, maxDiff) / 100);
}

export function curvePoints(
  type: CurveType,
  maxDiff: number,
  samples = 32,
): { x: number; y: number }[] {
  const r = curveRatio(maxDiff);
  return Array.from({ length: samples + 1 }, (_, index) => {
    const x = index / samples;
    return { x, y: curveShape(type, x, r) };
  });
}

/**
 * Asigna el fondo siguiendo el ranking. Nunca entrega más que el costo del
 * curso a una persona. Los empates técnicos reciben exactamente el mismo monto.
 */
export function allocate(
  ranked: RankedApplicant[],
  budget: number,
  courseCost: number,
  maxDiff: number,
  curve: CurveType,
): AllocationResult {
  const n = ranked.length;
  const available = Math.max(0, budget);
  const cost = Math.max(0, courseCost);
  const totalRequested = n * cost;
  const noAmounts: AllocationResult = {
    amounts: [],
    totalRequested,
    totalAssigned: 0,
    budget: available,
    remaining: available,
    coverage: 0,
    caseA: false,
    spread: null,
    tieGroups: [],
  };

  if (n === 0) {
    return noAmounts;
  }

  if (cost === 0) {
    return {
      ...noAmounts,
      amounts: new Array<number>(n).fill(0),
    };
  }

  if (available >= totalRequested) {
    return {
      amounts: new Array<number>(n).fill(cost),
      totalRequested,
      totalAssigned: totalRequested,
      budget: available,
      remaining: available - totalRequested,
      coverage: 1,
      caseA: true,
      spread: 0,
      tieGroups: [],
    };
  }

  const r = curveRatio(maxDiff);
  const rawWeights = ranked.map((_, index) =>
    curveShape(curve, n === 1 ? 0 : index / (n - 1), r),
  );
  const weightTotal = rawWeights.reduce((sum, weight) => sum + weight, 0);
  const weights = rawWeights.map((weight) => weight / weightTotal);

  const amounts = new Array<number>(n).fill(0);
  let remaining = available;
  let active = weights.map((_, index) => index);

  for (let guard = 0; guard < n + 3 && remaining > 0.01; guard += 1) {
    const activeWeight = active.reduce(
      (sum, index) => sum + weights[index],
      0,
    );
    if (activeWeight <= 0) break;

    let distributed = 0;
    const nextActive: number[] = [];

    for (const index of active) {
      const share = (remaining * weights[index]) / activeWeight;
      const room = cost - amounts[index];
      const addition = Math.min(share, room);
      amounts[index] += addition;
      distributed += addition;
      if (cost - amounts[index] > 0.01) {
        nextActive.push(index);
      }
    }

    if (distributed < 0.01) break;
    remaining -= distributed;
    active = nextActive;
  }

  const tieGroups: TieGroupResult[] = [];
  const tieMap = new Map<string, number[]>();
  ranked.forEach((member, index) => {
    if (!member.tieId) return;
    const positions = tieMap.get(member.tieId) ?? [];
    positions.push(index);
    tieMap.set(member.tieId, positions);
  });

  for (const [id, positions] of tieMap) {
    if (positions.length < 2) continue;
    const total = positions.reduce((sum, index) => sum + amounts[index], 0);
    const amount = total / positions.length;
    for (const index of positions) {
      amounts[index] = amount;
    }
    tieGroups.push({
      id,
      amount,
      members: positions.map((index) => ranked[index]),
    });
  }

  const totalAssigned = amounts.reduce((sum, amount) => sum + amount, 0);
  const first = amounts[0] ?? 0;
  const last = amounts[n - 1] ?? 0;
  const spread = last > 0 ? (first / last - 1) * 100 : null;

  return {
    amounts,
    totalRequested,
    totalAssigned,
    budget: available,
    remaining: Math.max(0, available - totalAssigned),
    coverage: Math.min(1, available / totalRequested),
    caseA: false,
    spread,
    tieGroups,
  };
}

export function summarizeByGroup(
  groups: Group[],
  applicants: Applicant[],
  ranked: RankedApplicant[],
  amounts: number[],
): GroupSummary[] {
  const rankedIndex = new Map<string, number>();
  ranked.forEach((member, index) => {
    rankedIndex.set(member.applicant.id, index);
  });

  return groups.map((group) => {
    const groupApplicants = applicants.filter(
      (applicant) => applicant.groupId === group.id,
    );
    const groupRanked = ranked.filter(
      (member) => member.applicant.groupId === group.id,
    );
    const allocated = groupRanked.filter((member) => {
      const index = rankedIndex.get(member.applicant.id);
      return index !== undefined && amounts[index] > 0;
    });

    return {
      group,
      applicantCount: groupApplicants.length,
      admissibleCount: groupRanked.length,
      allocatedCount: allocated.length,
      allocatedTotal: allocated.reduce((sum, member) => {
        const index = rankedIndex.get(member.applicant.id) ?? -1;
        return sum + (index >= 0 ? amounts[index] : 0);
      }, 0),
    };
  });
}
