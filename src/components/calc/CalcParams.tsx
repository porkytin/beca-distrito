import { Icon } from '../Icon';
import { BigCurve, MiniCurve } from '../CurveChart';
import {
  InfoNote,
  NumberField,
  Panel,
  RangeField,
  Stat,
  TypePill,
} from '../ui';
import {
  formatCLP,
  formatDecimal,
  formatPercent,
} from '../../domain/format';
import {
  CURVES,
  CURVE_META,
  type SimulationParams,
} from '../../domain/types';
import type { SimulationView } from '../../domain/simulation';

interface CalcParamsProps {
  params: SimulationParams;
  updateParams: (patch: Partial<SimulationParams>) => void;
  simulation: SimulationView;
}

const coverageOptions = [50, 75, 100, 120];

export function CalcParams({
  params,
  updateParams,
  simulation,
}: CalcParamsProps) {
  const { allocation } = simulation;
  const requested = allocation.totalRequested;
  const coverage = requested > 0 ? Math.min(1, params.budget / requested) : 0;
  const caseA = params.budget >= requested && requested > 0;
  const firstAmount = allocation.amounts[0] ?? 0;
  const lastAmount = allocation.amounts[allocation.amounts.length - 1] ?? 0;
  const ratioHint =
    params.minRatioDiff > 0
      ? `1 Nivel Medio cada ${Math.round(1 / params.minRatioDiff)} NNJ`
      : 'Solo ratios idénticos se consideran empate';
  const multiple = 1 + params.maxDiff / 100;

  return (
    <div className="calc-params">
      <div className="calc-params-main">
        <Panel title="Fondo y costo" icon="coins">
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
              min={0}
              max={5_000_000}
              step={10_000}
              onChange={(value) => updateParams({ courseCost: value })}
              hint={`${formatCLP(params.courseCost)} por persona`}
            />
          </div>

          <div className="quick-budget">
            <span className="field-label">Cobertura sobre la demanda admisible</span>
            <div className="quick-buttons">
              {coverageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`chip-button ${
                    Math.round(coverage * 100) === option ? 'is-active' : ''
                  }`}
                  aria-pressed={Math.round(coverage * 100) === option}
                  disabled={requested === 0}
                  onClick={() =>
                    updateParams({
                      budget: Math.round(requested * (option / 100)),
                    })
                  }
                >
                  {option}%
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Mecanismo" icon="sliders">
          <div className="control-stack">
            <RangeField
              label="Tolerancia de empate RSH"
              value={params.tolerance}
              min={0}
              max={10}
              step={0.5}
              onChange={(value) => updateParams({ tolerance: value })}
              format={(value) => `${formatDecimal(value, 1)} pp RSH`}
              hint="Ancho del balde de vulnerabilidad. Dentro de él, los postulantes se consideran empatados en RSH."
            />

            <RangeField
              label="Diferencia relativa máxima"
              value={params.maxDiff}
              min={0}
              max={300}
              step={10}
              onChange={(value) => updateParams({ maxDiff: value })}
              format={(value) => formatPercent(value, 0)}
              hint={`El primer lugar puede recibir hasta ${formatDecimal(
                multiple,
                1,
              )} veces el monto del último.`}
              accent="var(--amber)"
            />

            <RangeField
              label="Diferencia mínima de ratio Nivel Medio / NNJ"
              value={params.minRatioDiff}
              min={0}
              max={0.2}
              step={0.005}
              onChange={(value) => updateParams({ minRatioDiff: value })}
              format={(value) => formatDecimal(value, 3)}
              hint={`${ratioHint}. Diferencias menores se consideran empate técnico.`}
              accent="var(--teal)"
            />
          </div>

          <div className="curve-picker">
            <div className="field-head">
              <span className="field-label">Tendencia de la curva</span>
              <span className="field-value">{CURVE_META[params.curve].label}</span>
            </div>
            <div className="curve-options">
              {CURVES.map((curve) => {
                const meta = CURVE_META[curve];
                const selected = params.curve === curve;
                return (
                  <button
                    key={curve}
                    type="button"
                    className={`curve-option ${selected ? 'is-selected' : ''}`}
                    onClick={() => updateParams({ curve })}
                    aria-pressed={selected}
                  >
                    <div className="curve-option-top">
                      <span>{meta.label}</span>
                      <span className="curve-check">
                        {selected && <Icon name="check" size={13} />}
                      </span>
                    </div>
                    <MiniCurve
                      curve={curve}
                      maxDiff={params.maxDiff}
                      selected={selected}
                    />
                    <p>{meta.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      <div className="calc-params-side">
        <Panel
          title="Curva de asignación"
          icon="target"
          aside={
            <TypePill tone={requested === 0 ? 'neutral' : caseA ? 'green' : 'amber'}>
              {requested === 0
                ? 'Sin demanda admisible'
                : caseA
                  ? 'Fondo suficiente'
                  : `${formatPercent(coverage * 100, 0)} de cobertura`}
            </TypePill>
          }
        >
          <BigCurve curve={params.curve} maxDiff={params.maxDiff} />

          <div className="curve-impact">
            <div>
              <span className="impact-label">1° puesto</span>
              <strong>{formatCLP(firstAmount)}</strong>
            </div>
            <div className="impact-arrow">
              <Icon name="arrowRight" size={18} />
            </div>
            <div>
              <span className="impact-label">Último puesto</span>
              <strong>{formatCLP(lastAmount)}</strong>
            </div>
          </div>

          <p className="curve-caption">
            Montos calculados con el fondo y el ranking actuales. La brecha real
            puede ser menor si el fondo cubre todo o si los primeros puestos
            alcanzan el costo del curso.
          </p>
        </Panel>

        <div className="params-side-stats">
          <Stat
            label="Demanda admisible"
            value={formatCLP(requested)}
            hint={`${simulation.admissible.length} postulaciones`}
            icon="users"
          />
          <Stat
            label="Baldes RSH"
            value={simulation.buckets.length}
            hint={`Tolerancia de ${formatDecimal(params.tolerance, 1)} pp`}
            icon="layers"
          />
          <Stat
            label="Monto asignado"
            value={formatCLP(allocation.totalAssigned)}
            hint={
              requested === 0
                ? 'Sin postulaciones'
                : `${formatPercent(coverage * 100, 0)} del fondo`
            }
            icon="coins"
            accent="var(--accent)"
          />
        </div>

        <InfoNote icon="info">
          Los parámetros no modifican la dotación de los Grupos ni la nómina de
          postulaciones. Solo cambian la agrupación, el desempate y la forma de
          repartir el fondo.
        </InfoNote>
      </div>
    </div>
  );
}
