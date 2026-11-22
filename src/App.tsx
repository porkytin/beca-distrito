import { useEffect, useMemo, useState } from 'react';
import { Icon } from './components/Icon';
import { Landing } from './components/Landing';
import { SimulationStart } from './components/slides/SimulationStart';
import { GroupsSlide } from './components/slides/GroupsSlide';
import { ApplicantsSlide } from './components/slides/ApplicantsSlide';
import { FundSlide } from './components/slides/FundSlide';
import { RegularitySlide } from './components/slides/RegularitySlide';
import { ParametersSlide } from './components/slides/ParametersSlide';
import { BucketsSlide } from './components/slides/BucketsSlide';
import { RankingSlide } from './components/slides/RankingSlide';
import { AllocationSlide } from './components/slides/AllocationSlide';
import { ReportSlide } from './components/slides/ReportSlide';
import { CalcWorkspace, type CalcTab } from './components/calc/CalcWorkspace';
import { RulesDialog } from './components/RulesDialog';
import { generateDataset } from './domain/generate';
import { buildSimulation } from './domain/simulation';
import { newSeed, clamp } from './domain/random';
import { DEFAULT_PARAMS, DEFAULT_RANDOM } from './domain/defaults';
import { normalizeParams } from './domain/manual';
import { useCalculation } from './useCalculation';
import type { RandomConfig, SimulationParams } from './domain/types';

const SLIDES = [
  { label: 'Resumen', short: 'Resumen' },
  { label: 'Grupos', short: 'Grupos' },
  { label: 'Postulaciones', short: 'Postulaciones' },
  { label: 'Fondo', short: 'Fondo' },
  { label: 'Regularidad', short: 'Regularidad' },
  { label: 'Parámetros', short: 'Parámetros' },
  { label: 'Baldes', short: 'Baldes' },
  { label: 'Ranking', short: 'Ranking' },
  { label: 'Asignación', short: 'Asignación' },
  { label: 'Reporte', short: 'Reporte' },
];

const CALC_TAB_LABELS: Record<CalcTab, string> = {
  datos: 'Datos',
  parametros: 'Parámetros',
  resultado: 'Resultado',
};

type Mode = 'start' | 'simulation' | 'calculation';

interface Route {
  mode: Mode;
  step: number;
  tab: CalcTab;
}

function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, '');
  const calculation = clean.match(/^calculo(?:\/([a-z]+))?$/);
  if (calculation) {
    const tab = calculation[1];
    return {
      mode: 'calculation',
      step: 0,
      tab:
        tab === 'parametros' || tab === 'resultado' || tab === 'datos'
          ? tab
          : 'datos',
    };
  }

  const simulation = clean.match(/^simulacion(?:\/(\d+))?$/);
  if (simulation) {
    return {
      mode: 'simulation',
      step: simulation[1]
        ? clamp(Number(simulation[1]), 0, SLIDES.length - 1)
        : 0,
      tab: 'datos',
    };
  }

  const legacyStep = clean.match(/^paso-(\d+)$/);
  if (legacyStep) {
    return {
      mode: 'simulation',
      step: clamp(Number(legacyStep[1]), 0, SLIDES.length - 1),
      tab: 'datos',
    };
  }

  return { mode: 'start', step: 0, tab: 'datos' };
}

function routeHash(route: Route): string {
  if (route.mode === 'calculation') {
    return `#calculo/${route.tab}`;
  }
  if (route.mode === 'simulation') {
    return `#simulacion/${route.step}`;
  }
  return '#inicio';
}

export default function App() {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(window.location.hash),
  );
  const [random, setRandom] = useState<RandomConfig>(DEFAULT_RANDOM);
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [regularity, setRegularity] = useState<Record<number, boolean>>({});
  const [generatedAt] = useState(() => new Date());
  const [rulesOpen, setRulesOpen] = useState(false);

  const {
    calculation,
    simulation: calculationSimulation,
    savedAt,
    actions: calculationActions,
  } = useCalculation();

  const dataset = useMemo(() => generateDataset(random), [random]);

  const groups = useMemo(
    () =>
      dataset.groups.map((group) => ({
        ...group,
        regular: regularity[group.id] ?? group.regular,
      })),
    [dataset.groups, regularity],
  );

  const simulation = useMemo(
    () => buildSimulation(groups, dataset.applicants, params),
    [groups, dataset.applicants, params],
  );

  const updateRandom = (patch: Partial<RandomConfig>) => {
    if (patch.seed !== undefined) {
      setRegularity({});
    }

    setRandom((previous) => {
      const next = { ...previous, ...patch };

      if (patch.nnjMin !== undefined && next.nnjMin > next.nnjMax) {
        next.nnjMax = next.nnjMin;
      }
      if (patch.nnjMax !== undefined && next.nnjMax < next.nnjMin) {
        next.nnjMin = next.nnjMax;
      }

      if (
        patch.nivelMedioMin !== undefined &&
        next.nivelMedioMin > next.nivelMedioMax
      ) {
        next.nivelMedioMax = next.nivelMedioMin;
      }
      if (
        patch.nivelMedioMax !== undefined &&
        next.nivelMedioMax < next.nivelMedioMin
      ) {
        next.nivelMedioMin = next.nivelMedioMax;
      }

      if (
        patch.applicantsMin !== undefined &&
        next.applicantsMin > next.applicantsMax
      ) {
        next.applicantsMax = next.applicantsMin;
      }
      if (
        patch.applicantsMax !== undefined &&
        next.applicantsMax < next.applicantsMin
      ) {
        next.applicantsMin = next.applicantsMax;
      }

      if (patch.rshMin !== undefined && next.rshMin > next.rshMax) {
        next.rshMax = next.rshMin;
      }
      if (patch.rshMax !== undefined && next.rshMax < next.rshMin) {
        next.rshMin = next.rshMax;
      }

      next.nnjMin = clamp(Math.round(next.nnjMin), 1, 200);
      next.nnjMax = clamp(Math.round(next.nnjMax), 1, 200);
      next.nivelMedioMin = clamp(Math.round(next.nivelMedioMin), 0, 60);
      next.nivelMedioMax = clamp(Math.round(next.nivelMedioMax), 0, 60);
      next.applicantsMin = clamp(Math.round(next.applicantsMin), 0, 4);
      next.applicantsMax = clamp(Math.round(next.applicantsMax), 0, 4);
      next.rshMin = clamp(Math.round(next.rshMin), 0, 100);
      next.rshMax = clamp(Math.round(next.rshMax), 0, 100);

      return next;
    });
  };

  const updateParams = (patch: Partial<SimulationParams>) => {
    setParams((previous) => normalizeParams({ ...previous, ...patch }));
  };

  const regenerate = () => {
    updateRandom({ seed: newSeed() });
  };

  const resetSimulation = () => {
    setRandom(DEFAULT_RANDOM);
    setParams(DEFAULT_PARAMS);
    setRegularity({});
    setRoute({ mode: 'simulation', step: 0, tab: 'datos' });
  };

  const downloadSimulationReport = async () => {
    const { downloadReport } = await import('./report/pdf');
    downloadReport({
      simulation,
      params,
      mode: 'simulation',
      seed: random.seed,
      generatedAt: new Date(),
    });
  };

  useEffect(() => {
    const hash = routeHash(route);
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  }, [route]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [route.mode, route.step, route.tab]);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (route.mode !== 'simulation') return;
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target.closest?.('dialog[open]')) return;
      if (event.key === 'ArrowRight') {
        setRoute((current) =>
          current.mode === 'simulation'
            ? {
                ...current,
                step: Math.min(SLIDES.length - 1, current.step + 1),
              }
            : current,
        );
      } else if (event.key === 'ArrowLeft') {
        setRoute((current) =>
          current.mode === 'simulation'
            ? { ...current, step: Math.max(0, current.step - 1) }
            : current,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [route.mode]);

  const openStart = () => setRoute({ mode: 'start', step: 0, tab: 'datos' });
  const openSimulation = () =>
    setRoute({ mode: 'simulation', step: 0, tab: 'datos' });
  const openCalculation = () =>
    setRoute({ mode: 'calculation', step: 0, tab: 'datos' });
  const setCalcTab = (tab: CalcTab) =>
    setRoute((current) => ({ ...current, mode: 'calculation', tab }));

  const goNext = () =>
    setRoute((current) =>
      current.mode === 'simulation'
        ? {
            ...current,
            step: Math.min(SLIDES.length - 1, current.step + 1),
          }
        : current,
    );
  const goPrevious = () =>
    setRoute((current) =>
      current.mode === 'simulation'
        ? { ...current, step: Math.max(0, current.step - 1) }
        : current,
    );

  const rulesParams =
    route.mode === 'calculation' ? calculation.params : params;

  const renderSlide = () => {
    switch (route.step) {
      case 0:
        return (
          <SimulationStart
            random={random}
            params={params}
            groups={groups.length}
            applicants={dataset.applicants.length}
            regularGroups={simulation.regularGroups}
            onStart={goNext}
            onShowRules={() => setRulesOpen(true)}
          />
        );
      case 1:
        return (
          <GroupsSlide
            random={random}
            updateRandom={updateRandom}
            regenerate={regenerate}
            groups={groups}
            applicants={dataset.applicants}
          />
        );
      case 2:
        return (
          <ApplicantsSlide
            random={random}
            updateRandom={updateRandom}
            groups={groups}
            applicants={dataset.applicants}
          />
        );
      case 3:
        return (
          <FundSlide
            params={params}
            updateParams={updateParams}
            applicants={dataset.applicants}
            admissible={simulation.admissible}
          />
        );
      case 4:
        return (
          <RegularitySlide
            groups={groups}
            applicants={dataset.applicants}
            admissible={simulation.admissible}
            excluded={simulation.excluded}
            onToggleGroup={(groupId, regular) =>
              setRegularity((current) => ({ ...current, [groupId]: regular }))
            }
            onAllRegular={() => {
              const all: Record<number, boolean> = {};
              for (const group of groups) {
                all[group.id] = true;
              }
              setRegularity(all);
            }}
          />
        );
      case 5:
        return (
          <ParametersSlide
            params={params}
            updateParams={updateParams}
            simulation={simulation}
          />
        );
      case 6:
        return (
          <BucketsSlide
            simulation={simulation}
            groups={groups}
            tolerance={params.tolerance}
          />
        );
      case 7:
        return (
          <RankingSlide
            simulation={simulation}
            groups={groups}
            params={params}
          />
        );
      case 8:
        return (
          <AllocationSlide
            simulation={simulation}
            groups={groups}
            params={params}
          />
        );
      case 9:
        return (
          <ReportSlide
            simulation={simulation}
            params={params}
            random={random}
            generatedAt={generatedAt}
            onDownload={downloadSimulationReport}
            onReset={resetSimulation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={openStart}
          aria-label="Inicio · Becas Distrito"
        >
          <span className="brand-mark">
            <Icon name="scale" size={18} />
          </span>
          <span className="brand-text">
            <strong>Becas Distrito</strong>
            <small>Sistema de Becas de Formación</small>
          </span>
        </button>

        <div className="topbar-right">
          <nav className="mode-switch" aria-label="Modo de uso">
            <button
              type="button"
              className={route.mode === 'calculation' ? 'is-active' : ''}
              aria-current={
                route.mode === 'calculation' ? 'page' : undefined
              }
              onClick={openCalculation}
            >
              Cálculo
            </button>
            <button
              type="button"
              className={route.mode === 'simulation' ? 'is-active' : ''}
              aria-current={route.mode === 'simulation' ? 'page' : undefined}
              onClick={openSimulation}
            >
              Simulación
            </button>
          </nav>

          <span className="topbar-step">
            {route.mode === 'simulation'
              ? route.step === 0
                ? 'Resumen'
                : `Sección ${route.step} de ${SLIDES.length - 1}`
              : route.mode === 'calculation'
                ? CALC_TAB_LABELS[route.tab]
                : 'Inicio'}
          </span>

          <button
            type="button"
            className="rules-trigger"
            onClick={() => setRulesOpen(true)}
            aria-haspopup="dialog"
            aria-label="Reglas del sistema"
            title="Ver las reglas del sistema"
          >
            <Icon name="scale" size={15} />
            <span>Reglas</span>
          </button>

          {route.mode === 'simulation' && route.step > 0 && (
            <button
              type="button"
              className="icon-button"
              onClick={resetSimulation}
              title="Reiniciar simulación"
              aria-label="Reiniciar simulación"
            >
              <Icon name="refresh" size={17} />
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {route.mode === 'start' && (
          <Landing
            onCalculation={openCalculation}
            onSimulation={openSimulation}
            onShowRules={() => setRulesOpen(true)}
          />
        )}

        {route.mode === 'simulation' && (
          <div className="slide" key={route.step}>
            {renderSlide()}
          </div>
        )}

        {route.mode === 'calculation' && (
          <CalcWorkspace
            calculation={calculation}
            simulation={calculationSimulation}
            savedAt={savedAt}
            actions={calculationActions}
            tab={route.tab}
            onTabChange={setCalcTab}
          />
        )}
      </main>

      {route.mode === 'simulation' && (
        <footer className="bottom-nav">
          <div className="progress-track">
            <span
              style={{
                width: `${(route.step / (SLIDES.length - 1)) * 100}%`,
              }}
            />
          </div>
          <div className="nav-inner">
            <button
              type="button"
              className="btn btn-quiet nav-arrow"
              onClick={goPrevious}
              disabled={route.step === 0}
              aria-label="Sección anterior"
            >
              <Icon name="arrowLeft" size={18} />
              <span>Anterior</span>
            </button>

            <div
              className="stepper"
              role="group"
              aria-label="Secciones de la simulación"
            >
              {SLIDES.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  aria-current={index === route.step ? 'step' : undefined}
                  aria-label={slide.label}
                  className={`step ${index === route.step ? 'is-active' : ''} ${
                    index < route.step ? 'is-done' : ''
                  }`}
                  onClick={() =>
                    setRoute((current) => ({
                      ...current,
                      mode: 'simulation',
                      step: index,
                    }))
                  }
                >
                  <span className="step-dot">
                    {index < route.step ? <Icon name="check" size={11} /> : index + 1}
                  </span>
                  <span className="step-label">{slide.short}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary nav-arrow"
              onClick={goNext}
              disabled={route.step === SLIDES.length - 1}
              aria-label="Sección siguiente"
            >
              <span>Siguiente</span>
              <Icon name="arrowRight" size={18} />
            </button>
          </div>
        </footer>
      )}

      <RulesDialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        params={rulesParams}
        mode={
          route.mode === 'calculation'
            ? 'calculation'
            : route.mode === 'simulation'
              ? 'simulation'
              : 'start'
        }
      />
    </div>
  );
}
