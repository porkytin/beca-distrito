import {
  GROUP_COLORS,
  ROLES,
  type Applicant,
  type Dataset,
  type Group,
  type RandomConfig,
  type Role,
  type RoleWeights,
} from './types';
import { clamp, mulberry32, randomInt } from './random';

const GROUP_COUNT = 10;

function pickWeightedRole(
  next: () => number,
  weights: RoleWeights,
  alreadyUsed: Set<Role>,
): Role {
  const total = ROLES.reduce((sum, role) => sum + Math.max(0, weights[role]), 0);
  if (total <= 0) {
    return ROLES[Math.floor(next() * ROLES.length)];
  }

  let ticket = next() * total;
  let chosen: Role = ROLES[ROLES.length - 1];
  for (const role of ROLES) {
    ticket -= Math.max(0, weights[role]);
    if (ticket <= 0) {
      chosen = role;
      break;
    }
  }

  // Un Grupo tiene un solo Responsable de Grupo y un solo Asistente de Grupo.
  if (
    (chosen === 'responsableGrupo' || chosen === 'asistenteGrupo') &&
    alreadyUsed.has(chosen)
  ) {
    return weights.otro > 0 ? 'otro' : 'responsableUnidad';
  }

  return chosen;
}

/**
 * Construye los 10 grupos y sus postulaciones a partir de la configuración
 * de aleatoriedad. No aplica la regularidad manual: eso ocurre en la capa UI.
 */
export function generateDataset(config: RandomConfig): Dataset {
  const next = mulberry32(config.seed);
  const groups: Group[] = [];
  const applicants: Applicant[] = [];
  let applicantNumber = 1;

  for (let index = 0; index < GROUP_COUNT; index += 1) {
    const groupId = index + 1;
    const nnj = Math.max(1, randomInt(next, config.nnjMin, config.nnjMax));
    const nivelMedio = Math.max(
      0,
      randomInt(next, config.nivelMedioMin, config.nivelMedioMax),
    );
    const ratio = nivelMedio / nnj;
    const regular = next() * 100 >= config.irregularChance;

    const group: Group = {
      id: groupId,
      name: `Grupo ${String(groupId).padStart(2, '0')}`,
      nnj,
      nivelMedio,
      ratio,
      regular,
      color: GROUP_COLORS[index % GROUP_COLORS.length],
    };
    groups.push(group);

    const count = randomInt(
      next,
      config.applicantsMin,
      config.applicantsMax,
    );
    const usedRoles = new Set<Role>();

    for (let n = 0; n < count; n += 1) {
      const role = pickWeightedRole(next, config.roleWeights, usedRoles);
      usedRoles.add(role);

      // La concentración empuja la muestra hacia los percentiles bajos,
      // que representan la mayor vulnerabilidad socioeconómica.
      const uniform = next();
      const exponent = 1 + clamp(config.rshConcentration, 0, 100) / 33.33;
      const biased = Math.pow(uniform, exponent);
      const rsh = Math.round(
        clamp(
          config.rshMin + biased * (config.rshMax - config.rshMin),
          0,
          100,
        ),
      );

      applicants.push({
        id: `P-${String(applicantNumber).padStart(2, '0')}`,
        label: `Postulante ${String(applicantNumber).padStart(2, '0')}`,
        groupId,
        role,
        rsh,
        groupRatio: ratio,
      });
      applicantNumber += 1;
    }
  }

  return { groups, applicants };
}
