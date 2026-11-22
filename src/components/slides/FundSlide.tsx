import type { CSSProperties } from 'react';
import {
  InfoNote,
  NumberField,
  Panel,
  SlideHeading,
  TypePill,
} from '../ui';
import { formatCLP, formatNumber, formatPercent } from '../../domain/format';
import type {
  Applicant,
  SimulationParams,
} from '../../domain/types';

interface FundSlideProps {
  params: SimulationParams;
  updateParams: (patch: Partial<SimulationParams>) => void;
  applicants: Applicant[];
  admissible: Applicant[];
}

const coverageOptions = [50, 75, 100, 120];

export function FundSlide({
  params,
  updateParams,
  applicants,
  admissible,
}: FundSlideProps) {
  const requestedAll = applicants.length * params.courseCost;
  const requestedAdmissible = admissible.length * params.courseCost;
  const coverage =
    requestedAdmissible > 0
      ? Math.min(1, params.budget / requestedAdmissible)
      : 0;
  const caseA = params.budget >= requestedAdmissible && requestedAdmissible > 0;
  const maxMoney = Math.max(requestedAll, params.budget, 1);
  const gaugeColor = caseA ? 'var(--green)' : 'var(--amber)';

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Simulación · Determinación del fondo"
        title="Fondo y costo del Curso Medio"
        lede="La Asamblea de Distrito aprueba el fondo anual. El monto y el costo de referencia del Curso Medio determinan si el fondo cubre toda la demanda admisible o si debe distribuirse según el ranking."
      />

      <div className="fund-layout">
        <div className="fund-controls">
          <Panel title="Presupuesto y costo" icon="coins">
            <div className="money-fields">
              <NumberField
                label="Fondo anual de becas"
                value={params.budget}
                min={0}
                max={200_000_000}
                step={100_000}
                onChange={(value) => updateParams({ budget: value })}
                hint={formatCLP(params.budget)}
              />
              <NumberField
                label="Costo del Curso Medio"
                value={params.courseCost}
                min={10_000}
                max={5_000_000}
                step={10_000}
                onChange={(value) => updateParams({ courseCost: value })}
                hint={`${formatCLP(params.courseCost)} por persona`}
              />
            </div>

            <div className="quick-budget">
              <span className="field-label">Ajustar cobertura del fondo</span>
              <div className="quick-buttons">
                {coverageOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`chip-button ${
                      Math.round(coverage * 100) === option ? 'is-active' : ''
                    }`}
                    aria-pressed={Math.round(coverage * 100) === option}
                    disabled={requestedAdmissible === 0}
                    onClick={() =>
                      updateParams({
                        budget: Math.round(
                          requestedAdmissible * (option / 100),
                        ),
                      })
                    }
                  >
                    {option}%
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <InfoNote icon="info">
            La comparación usa{' '}
            <strong>
              {formatNumber(admissible.length)}{' '}
              {admissible.length === 1
                ? 'postulación admisible'
                : 'postulaciones admisibles'}
            </strong>
            . Las postulaciones de Grupos irregulares se excluyen antes del
            cálculo. Si el fondo alcanza, cada persona recibe el 100% del costo.
          </InfoNote>
        </div>

        <div className="fund-visual">
          <div className="fund-hero card">
            <div
              className="fund-gauge"
              style={
                {
                  '--gauge': `${coverage * 100}%`,
                  '--gauge-color': gaugeColor,
                } as CSSProperties
              }
            >
              <div className="fund-gauge-inner">
                <strong>
                  {requestedAdmissible === 0
                    ? '—'
                    : formatPercent(Math.round(coverage * 100))}
                </strong>
                <span>de cobertura</span>
              </div>
            </div>

            <div className="fund-hero-copy">
              <TypePill tone={caseA ? 'green' : 'amber'}>
                {requestedAdmissible === 0
                  ? 'Sin demanda admisible'
                  : caseA
                    ? 'Caso A · Fondos suficientes'
                    : 'Caso B · Fondos insuficientes'}
              </TypePill>
              <h3>
                {requestedAdmissible === 0
                  ? 'No hay postulaciones para asignar'
                  : caseA
                    ? 'El fondo cubre toda la demanda'
                    : 'El fondo no cubre todo lo solicitado'}
              </h3>
              <p>
                {requestedAdmissible === 0
                  ? 'Cambia la regularidad de los Grupos o genera nuevas postulaciones.'
                  : caseA
                    ? `Sobran ${formatCLP(
                        params.budget - requestedAdmissible,
                      )}. Cada postulante admisible recibirá el costo completo del curso.`
                    : `Faltan ${formatCLP(
                        requestedAdmissible - params.budget,
                      )}. La Comisión de Becas aplicará el ranking y la curva de asignación para repartir el fondo.`}
              </p>
            </div>
          </div>

          <div className="card fund-bars">
            <div className="mini-section-head">
              <span className="mini-label">Fondo vs. demanda</span>
              <span className="panel-note">Montos en pesos</span>
            </div>

            <div className="compare-row">
              <div className="compare-label">
                <span>Demanda total</span>
                <b>{formatCLP(requestedAll)}</b>
              </div>
              <div className="compare-track">
                <span
                  className="compare-fill"
                  style={{
                    width: `${(requestedAll / maxMoney) * 100}%`,
                    background: 'var(--ink-soft)',
                  }}
                />
              </div>
            </div>

            <div className="compare-row">
              <div className="compare-label">
                <span>Demanda admisible</span>
                <b>{formatCLP(requestedAdmissible)}</b>
              </div>
              <div className="compare-track">
                <span
                  className="compare-fill"
                  style={{
                    width: `${(requestedAdmissible / maxMoney) * 100}%`,
                    background: 'var(--accent)',
                  }}
                />
              </div>
            </div>

            <div className="compare-row">
              <div className="compare-label">
                <span>Fondo disponible</span>
                <b>{formatCLP(params.budget)}</b>
              </div>
              <div className="compare-track">
                <span
                  className="compare-fill"
                  style={{
                    width: `${(params.budget / maxMoney) * 100}%`,
                    background: gaugeColor,
                  }}
                />
              </div>
            </div>

            <div className="fund-facts">
              <div>
                <span>Postulantes</span>
                <strong>{formatNumber(applicants.length)}</strong>
              </div>
              <div>
                <span>Admisibles</span>
                <strong>{formatNumber(admissible.length)}</strong>
              </div>
              <div>
                <span>Costo por beca</span>
                <strong>{formatCLP(params.courseCost)}</strong>
              </div>
              <div>
                <span>Fondo</span>
                <strong>{formatCLP(params.budget)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
