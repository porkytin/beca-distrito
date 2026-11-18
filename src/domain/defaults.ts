import type { RandomConfig, SimulationParams } from './types';

export const DEFAULT_RANDOM: RandomConfig = {
  seed: 2026,
  nnjMin: 25,
  nnjMax: 95,
  nivelMedioMin: 2,
  nivelMedioMax: 9,
  applicantsMin: 1,
  applicantsMax: 3,
  rshMin: 5,
  rshMax: 95,
  rshConcentration: 35,
  irregularChance: 15,
  roleWeights: {
    responsableGrupo: 25,
    asistenteGrupo: 25,
    responsableUnidad: 35,
    otro: 15,
  },
};

export const DEFAULT_PARAMS: SimulationParams = {
  tolerance: 2,
  maxDiff: 100,
  curve: 'lineal',
  minRatioDiff: 0.05,
  budget: 3_000_000,
  courseCost: 250_000,
};
