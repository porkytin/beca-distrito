import { useEffect, useMemo, useState } from 'react';
import { Icon } from './components/Icon';
import { CoverSlide } from './components/slides/CoverSlide';
import { GroupsSlide } from './components/slides/GroupsSlide';
import { ApplicantsSlide } from './components/slides/ApplicantsSlide';
import { FundSlide } from './components/slides/FundSlide';
import { RegularitySlide } from './components/slides/RegularitySlide';
import { ParametersSlide } from './components/slides/ParametersSlide';
import { BucketsSlide } from './components/slides/BucketsSlide';
import { RankingSlide } from './components/slides/RankingSlide';
import { AllocationSlide } from './components/slides/AllocationSlide';
import { ReportSlide } from './components/slides/ReportSlide';
import { RulesDialog } from './components/RulesDialog';
import { generateDataset } from './domain/generate';
import { buildSimulation } from './domain/simulation';
import { newSeed, clamp } from './domain/random';
import { DEFAULT_PARAMS, DEFAULT_RANDOM } from './domain/defaults';
import type { RandomConfig, SimulationParams } from './domain/types';

const SLIDES = [
  { label: 'Inicio', short: 'Inicio' },
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

export default function App() {
  const [step, setStep] = useState(() => {
    const match = window.location.hash.match(/paso-(\d+)/);
    if (!match) return 0;
    return clamp(Number(match[1]), 0, SLIDES.length - 1);
  });
  const [random, setRandom] = useState<RandomConfig>(DEFAULT_RANDOM);
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [regularity, setRegularity] = useState<Record<number, boolean>>({});
  const [generatedAt] = useState(() => new Date());
  const [rulesOpen, setRulesOpen] = useState(false);

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

      if (
        patch.nnjMin !== undefined &&
        next.nnjMin > next.nnjMax
      ) {
        next.nnjMax = next.nnjMin;
      }
      if (
        patch.nnjMax !== undefined &&
        next.nnjMax < next.nnjMin
      ) {
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
    setParams((previous) => {
      const next = { ...previous, ...patch };
      next.budget = Math.max(0, Math.round(next.budget));
      next.courseCost = Math.max(0, Math.round(next.courseCost));
      next.tolerance = clamp(next.tolerance, 0, 20);
      next.maxDiff = clamp(next.maxDiff, 0, 500);
      next.minRatioDiff = clamp(next.minRatioDiff, 0, 1);
      return next;
    });
  };

  const regenerate = () => {
    updateRandom({ seed: newSeed() });
  };

  const reset = () => {
    setRandom(DEFAULT_RANDOM);
    setParams(DEFAULT_PARAMS);
    setRegularity({});
    setStep(0);
  };

  const download = async () => {
    const { downloadReport } = await import('./report/pdf');
    downloadReport({
      simulation,
      params,
      random,
      generatedAt: new Date(),
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [step]);

  useEffect(() => {
    const hash = `#paso-${step}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  }, [step]);

  useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/paso-(\d+)/);
      if (match) {
        setStep(clamp(Number(match[1]), 0, SLIDES.length - 1));
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target.closest?.('dialog[open]')) return;
      if (event.key === 'ArrowRight') {
        setStep((current) => Math.min(SLIDES.length - 1, current + 1));
      } else if (event.key === 'ArrowLeft') {
        setStep((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const goNext = () =>
    setStep((current) => Math.min(SLIDES.length - 1, current + 1));
  const goPrevious = () => setStep((current) => Math.max(0, current - 1));

  const renderSlide = () => {
    switch (step) {
      case 0:
        return (
          <CoverSlide onStart={goNext} onShowRules={() => setRulesOpen(true)} />
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
            onDownload={download}
            onReset={reset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => setStep(0)}>
          <span className="brand-mark">
            <Icon name="sparkles" size={18} />
          </span>
          <span className="brand-text">
            <strong>Becas Distrito</strong>
            <small>Simulador interactivo</small>
          </span>
        </button>

        <div className="topbar-right">
          <span className="topbar-step">
            {step === 0
              ? 'Recorrido guiado'
              : `Sección ${step} de ${SLIDES.length - 1}`}
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
          {step > 0 && (
            <button
              type="button"
              className="icon-button"
              onClick={reset}
              title="Reiniciar simulación"
              aria-label="Reiniciar simulación"
            >
              <Icon name="refresh" size={17} />
            </button>
          )}
        </div>
      </header>

      <main className="main">
        <div className={`slide ${step === 0 ? 'slide-cover' : ''}`} key={step}>
          {renderSlide()}
        </div>
      </main>

      <footer className="bottom-nav">
        <div className="progress-track">
          <span
            style={{
              width: `${(step / (SLIDES.length - 1)) * 100}%`,
            }}
          />
        </div>
        <div className="nav-inner">
          <button
            type="button"
            className="btn btn-quiet nav-arrow"
            onClick={goPrevious}
            disabled={step === 0}
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
                aria-current={index === step ? 'step' : undefined}
                aria-label={slide.label}
                className={`step ${index === step ? 'is-active' : ''} ${
                  index < step ? 'is-done' : ''
                }`}
                onClick={() => setStep(index)}
              >
                <span className="step-dot">
                  {index < step ? <Icon name="check" size={11} /> : index + 1}
                </span>
                <span className="step-label">{slide.short}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary nav-arrow"
            onClick={goNext}
            disabled={step === SLIDES.length - 1}
            aria-label={
              step === 0 ? 'Comenzar simulación' : 'Sección siguiente'
            }
          >
            <span>{step === 0 ? 'Comenzar' : 'Siguiente'}</span>
            <Icon name="arrowRight" size={18} />
          </button>
        </div>
      </footer>

      <RulesDialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        params={params}
      />
    </div>
  );
}
