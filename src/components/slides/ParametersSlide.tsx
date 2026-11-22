import { Icon } from '../Icon';
import { BigCurve, MiniCurve } from '../CurveChart';
import {
  InfoNote,
  Panel,
  RangeField,
  SlideHeading,
  Stat,
  TypePill,
} from '../ui';
import { formatCLP, formatDecimal, formatPercent } from '../../domain/format';
import { CURVES, CURVE_META, type SimulationParams } from '../../domain/types';
import type { SimulationView } from '../../domain/simulation';

interface ParametersSlideProps {
  params: SimulationParams;
  updateParams: (patch: Partial<SimulationParams>) => void;
  simulation: SimulationView;
}

export function ParametersSlide({
  params,
  updateParams,
  simulation,
}: ParametersSlideProps) {
  const firstAmount = simulation.allocation.amounts[0] ?? 0;
  const lastAmount =
    simulation.allocation.amounts[simulation.allocation.amounts.length - 1] ?? 0;
  const ratioHint =
    params.minRatioDiff > 0
      ? `1 Nivel Medio cada ${Math.round(1 / params.minRatioDiff)} NNJ`
      : 'Solo ratios idénticos se consideran empate';
  const multiple = 1 + params.maxDiff / 100;

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Simulación · Parámetros del modelo"
        title="Las reglas finas del mecanismo"
        lede="La Comisión de Becas propone estos cuatro parámetros y la Asamblea los ratifica. Cambiarlos no altera los datos: altera cómo se agrupan, desempatan y reparten los mismos postulantes."
        meta={
          <TypePill tone="neutral">
            <Icon name="check" size={14} />
            Propuesta de la Comisión · ratificada por la Asamblea
          </TypePill>
        }
      />

      <div className="params-layout">
        <div className="params-controls">
          <Panel title="Parámetros ajustables" icon="sliders">
            <div className="control-stack">
              <RangeField
                label="Tolerancia de empate socioeconómico"
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
                <span className="field-value">4 opciones</span>
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

        <div className="params-preview">
          <Panel
            title="Vista previa de la curva"
            icon="target"
            aside={<span className="panel-badge">{CURVE_META[params.curve].label}</span>}
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
              Montos estimados con el fondo y el ranking actuales. La brecha
              real puede ser menor si el fondo alcanza para todos o si los
              primeros puestos topan con el costo del curso.
            </p>
          </Panel>

          <div className="params-side-stats">
            <Stat
              label="Baldes RSH"
              value={simulation.buckets.length}
              hint={`Tolerancia de ${formatDecimal(params.tolerance, 1)} pp`}
              icon="layers"
            />
            <Stat
              label="Brecha real"
              value={
                simulation.allocation.spread === null
                  ? '—'
                  : formatPercent(simulation.allocation.spread, 0)
              }
              hint="Entre el 1° y el último monto"
              icon="scale"
              accent="var(--amber)"
            />
            <Stat
              label="Cobertura"
              value={
                simulation.allocation.totalRequested === 0
                  ? '—'
                  : formatPercent(
                      Math.min(100, simulation.allocation.coverage * 100),
                      0,
                    )
              }
              hint={`${formatCLP(
                simulation.allocation.totalAssigned,
              )} asignados`}
              icon="coins"
              accent="var(--accent)"
            />
          </div>

          <InfoNote icon="info">
            Los parámetros no cambian el fondo ni los datos: solo la forma en
            que se ordena y reparte. Prueba mover la tolerancia para fusionar
            baldes o cambiar la curva para redistribuir los montos.
          </InfoNote>
        </div>
      </div>
    </div>
  );
}
