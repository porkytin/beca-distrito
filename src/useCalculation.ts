import { useEffect, useMemo, useState } from 'react';
import { buildSimulation, type SimulationView } from './domain/simulation';
import {
  emptyCalculation,
  groupRatio,
  makeApplicant,
  makeGroup,
  nextApplicantNumber,
  nextGroupId,
  normalizeParams,
  parseCalculation,
  sampleCalculation,
  type CalculationData,
} from './domain/manual';
import { clamp } from './domain/random';
import {
  GROUP_COLORS,
  type Applicant,
  type Group,
  type SimulationParams,
} from './domain/types';

const STORAGE_KEY = 'becas-distrito/calculo/v1';

function loadStoredCalculation(): CalculationData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCalculation();
    return parseCalculation(JSON.parse(raw)) ?? emptyCalculation();
  } catch {
    return emptyCalculation();
  }
}

export interface CalculationActions {
  addGroup: () => void;
  updateGroup: (
    id: number,
    patch: Partial<Pick<Group, 'name' | 'nnj' | 'nivelMedio' | 'regular'>>,
  ) => void;
  removeGroup: (id: number) => void;
  addApplicant: () => void;
  updateApplicant: (
    id: string,
    patch: Partial<Pick<Applicant, 'label' | 'groupId' | 'role' | 'rsh'>>,
  ) => void;
  removeApplicant: (id: string) => void;
  updateParams: (patch: Partial<SimulationParams>) => void;
  loadSample: () => void;
  clearAll: () => void;
  importBackup: (
    file: File,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  exportBackup: () => void;
}

export function useCalculation(): {
  calculation: CalculationData;
  simulation: SimulationView;
  savedAt: Date | null;
  actions: CalculationActions;
} {
  const [calculation, setCalculation] =
    useState<CalculationData>(loadStoredCalculation);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calculation));
      setSavedAt(new Date());
    } catch {
      setSavedAt(null);
    }
  }, [calculation]);

  const simulation = useMemo(
    () =>
      buildSimulation(
        calculation.groups,
        calculation.applicants,
        calculation.params,
      ),
    [calculation],
  );

  const actions: CalculationActions = {
    addGroup() {
      setCalculation((current) => {
        const id = nextGroupId(current.groups);
        const usedColors = new Set(current.groups.map((group) => group.color));
        const color =
          GROUP_COLORS.find((candidate) => !usedColors.has(candidate)) ??
          GROUP_COLORS[current.groups.length % GROUP_COLORS.length];
        return {
          ...current,
          groups: [
            ...current.groups,
            makeGroup(id, current.groups.length, { color }),
          ],
        };
      });
    },

    updateGroup(id, patch) {
      setCalculation((current) => ({
        ...current,
        groups: current.groups.map((group) => {
          if (group.id !== id) return group;
          const nnj = Math.max(0, Math.round(patch.nnj ?? group.nnj));
          const nivelMedio = Math.max(
            0,
            Math.round(patch.nivelMedio ?? group.nivelMedio),
          );
          return {
            ...group,
            ...patch,
            nnj,
            nivelMedio,
            ratio: groupRatio(nnj, nivelMedio),
          };
        }),
      }));
    },

    removeGroup(id) {
      setCalculation((current) => ({
        ...current,
        groups: current.groups.filter((group) => group.id !== id),
        applicants: current.applicants.filter(
          (applicant) => applicant.groupId !== id,
        ),
      }));
    },

    addApplicant() {
      setCalculation((current) => {
        const group = current.groups[0];
        if (!group) return current;
        const applicant = makeApplicant(
          nextApplicantNumber(current.applicants),
          group.id,
          { groupRatio: group.ratio },
        );
        return {
          ...current,
          applicants: [...current.applicants, applicant],
        };
      });
    },

    updateApplicant(id, patch) {
      setCalculation((current) => ({
        ...current,
        applicants: current.applicants.map((applicant) => {
          if (applicant.id !== id) return applicant;
          const group =
            patch.groupId !== undefined
              ? current.groups.find((item) => item.id === patch.groupId)
              : undefined;
          return {
            ...applicant,
            ...patch,
            rsh:
              patch.rsh !== undefined
                ? clamp(Math.round(patch.rsh), 0, 100)
                : applicant.rsh,
            groupRatio: group?.ratio ?? applicant.groupRatio,
          };
        }),
      }));
    },

    removeApplicant(id) {
      setCalculation((current) => ({
        ...current,
        applicants: current.applicants.filter(
          (applicant) => applicant.id !== id,
        ),
      }));
    },

    updateParams(patch) {
      setCalculation((current) => ({
        ...current,
        params: normalizeParams({ ...current.params, ...patch }),
      }));
    },

    loadSample() {
      setCalculation(sampleCalculation());
    },

    clearAll() {
      setCalculation(emptyCalculation());
    },

    async importBackup(file) {
      try {
        const text = await file.text();
        const parsed = parseCalculation(JSON.parse(text));
        if (!parsed) {
          return {
            ok: false,
            error: 'El archivo no tiene la estructura esperada.',
          };
        }
        setCalculation(parsed);
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: 'No se pudo leer el archivo JSON.',
        };
      }
    },

    exportBackup() {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        ...calculation,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `becas-calculo-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
  };

  return { calculation, simulation, savedAt, actions };
}
