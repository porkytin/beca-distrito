import { allocate } from '../src/domain/allocation';
import { DEFAULT_PARAMS, DEFAULT_RANDOM } from '../src/domain/defaults';
import { generateDataset } from '../src/domain/generate';
import { buildRanking } from '../src/domain/ranking';
import { buildSimulation } from '../src/domain/simulation';
import { CURVES, type SimulationParams } from '../src/domain/types';

let checks = 0;

function assert(condition: boolean, message: string) {
  checks += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function rangeCandidates() {
  return Array.from({ length: 21 }, (_, index) => index / 20);
}

for (let seed = 0; seed < 40; seed += 1) {
  const random = {
    ...DEFAULT_RANDOM,
    seed,
    irregularChance: 0,
  };
  const dataset = generateDataset(random);
  const groups = dataset.groups;
  const applicants = dataset.applicants;

  for (const curve of CURVES) {
    for (const tolerance of [0, 2, 10]) {
      for (const minRatioDiff of [0, 0.05, 0.2]) {
        const ranking = buildRanking(
          applicants,
          tolerance,
          minRatioDiff,
        );

        // El ranking es una permutación de los postulantes.
        assert(
          ranking.ranked.length === applicants.length,
          'ranking length mismatch',
        );
        const ids = new Set(ranking.ranked.map((member) => member.applicant.id));
        assert(ids.size === ranking.ranked.length, 'duplicate applicant in ranking');
        ranking.ranked.forEach((member, index) => {
          assert(
            member.position === index + 1,
            'positions must be sequential',
          );
        });

        // Los baldes están ordenados por RSH y son contiguos.
        for (let index = 1; index < ranking.buckets.length; index += 1) {
          assert(
            ranking.buckets[index].start > ranking.buckets[index - 1].end,
            `buckets overlap (seed ${seed})`,
          );
        }
        assert(
          ranking.buckets.reduce((sum, bucket) => sum + bucket.members.length, 0) ===
            applicants.length,
          'bucket membership incomplete',
        );

        for (const ratio of rangeCandidates()) {
          const params: SimulationParams = {
            ...DEFAULT_PARAMS,
            tolerance,
            minRatioDiff,
            curve,
            maxDiff: [0, 50, 100, 300][Math.min(3, Math.floor(ratio * 4))],
            budget: Math.round(
              ranking.ranked.length * DEFAULT_PARAMS.courseCost * ratio,
            ),
            courseCost: DEFAULT_PARAMS.courseCost,
          };

          const simulation = buildSimulation(groups, applicants, params);
          const allocation = simulation.allocation;
          const amounts = allocation.amounts;

          assert(
            amounts.length === ranking.ranked.length,
            'allocations length mismatch',
          );

          for (const amount of amounts) {
            assert(
              amount >= -0.001 && amount <= params.courseCost + 0.001,
              `amount outside [0, cost] (seed ${seed}, ${amount})`,
            );
          }

          for (let index = 1; index < amounts.length; index += 1) {
            assert(
              amounts[index] <= amounts[index - 1] + 0.01,
              `amounts not decreasing at ${index} (seed ${seed})`,
            );
          }

          const requested = ranking.ranked.length * params.courseCost;
          assert(
            Math.abs(allocation.totalRequested - requested) < 0.01,
            'requested mismatch',
          );

          if (requested === 0) {
            assert(allocation.totalAssigned === 0, 'empty allocation sum');
          } else if (params.budget >= requested) {
            assert(allocation.caseA, 'should be case A');
            assert(
              Math.abs(allocation.totalAssigned - requested) < 0.01,
              'case A should fund everything',
            );
            assert(
              amounts.every(
                (amount) => Math.abs(amount - params.courseCost) < 0.01,
              ),
              'case A must pay full cost',
            );
          } else {
            assert(!allocation.caseA, 'should be case B');
            assert(
              Math.abs(allocation.totalAssigned - params.budget) < 0.5,
              `case B must use the whole fund (seed ${seed}, budget ${params.budget}, assigned ${allocation.totalAssigned})`,
            );
            assert(
              allocation.totalAssigned <= params.budget + 0.01,
              'cannot exceed fund',
            );
          }

          // Los empates técnicos reciben exactamente el mismo monto.
          for (const tie of allocation.tieGroups) {
            const first = tie.members[0];
            const index = first.position - 1;
            for (const member of tie.members) {
              assert(
                Math.abs(amounts[member.position - 1] - amounts[index]) < 0.001,
                `tie amounts differ (seed ${seed})`,
              );
            }
          }

          // La brecha respeta el máximo cuando no hay topes.
          if (
            !allocation.caseA &&
            allocation.spread !== null &&
            allocation.spread > params.maxDiff + 0.01
          ) {
            // Solo puede superarse si hubo topes de costo o empates extremos.
            const anyCapped = amounts.some(
              (amount) => amount >= params.courseCost - 0.01,
            );
            assert(
              anyCapped || allocation.tieGroups.length > 0,
              `spread exceeds max without caps (seed ${seed}, ${allocation.spread})`,
            );
          }
        }
      }
    }
  }
}

// Casos borde.
const emptyAllocation = allocate([], 1_000_000, 250_000, 100, 'lineal');
assert(emptyAllocation.totalAssigned === 0, 'empty allocation');
assert(emptyAllocation.amounts.length === 0, 'empty amounts');

const dataset = generateDataset(DEFAULT_RANDOM);
const irregularAll = dataset.groups.map((group) => ({ ...group, regular: false }));
const noAdmissible = buildSimulation(irregularAll, dataset.applicants, {
  ...DEFAULT_PARAMS,
});
assert(noAdmissible.ranked.length === 0, 'no admissible ranking');
assert(noAdmissible.excluded.length === dataset.applicants.length, 'all excluded');
assert(noAdmissible.allocation.totalAssigned === 0, 'no assignment without admissible');

const zeroBudget = buildSimulation(dataset.groups, dataset.applicants, {
  ...DEFAULT_PARAMS,
  budget: 0,
});
assert(
  zeroBudget.allocation.amounts.every((amount) => amount === 0),
  'zero budget must assign zero',
);
assert(zeroBudget.allocation.caseA === false, 'zero budget is case B');

const fullBudget = buildSimulation(dataset.groups, dataset.applicants, {
  ...DEFAULT_PARAMS,
  budget: DEFAULT_PARAMS.courseCost * dataset.applicants.length,
});
assert(fullBudget.allocation.caseA, 'exact budget is case A');

console.log(`OK · ${checks.toLocaleString('es-CL')} comprobaciones`);
