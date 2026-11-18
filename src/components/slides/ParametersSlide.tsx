import { useId } from 'react';
import { Icon } from '../Icon';
import {
  InfoNote,
  Panel,
  RangeField,
  SlideHeading,
  Stat,
  TypePill,
} from '../ui';
import { curvePoints, curveRatio } from '../../domain/allocation';
import { formatCLP, formatDecimal, formatPercent } from '../../domain/format';
import { CURVES, CURVE_META, type SimulationParams } from '../../domain/types';
import type { SimulationView } from '../../domain/simulation';

interface ParametersSlideProps {
  params: SimulationParams;
  updateParams: (patch: Partial<SimulationParams>) => void;
  simulation: SimulationView;
}

function MiniCurve({
  curve,
  maxDiff,
  selected,
}: {
  curve: SimulationParams['curve'];
  maxDiff: number;
  selected: boolean;
}) {
  const points = curvePoints(curve, maxDiff, 24);
  const width = 92;
  const height = 40;
  const pad = 3;
  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${pad + point.x * (width - pad * 2)} ${
          pad + (1 - point.y) * (height - pad * 2)
        }`,
    )
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mini-curve"
      role="presentation"
    >
      <path
        d={`${path} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`}
        fill={selected ? 'rgba(109, 40, 217, 0.12)' : 'rgba(36, 17, 65, 0.05)'}
      />
      <path
        d={path}
        fill="none"
        stroke={selected ? 'var(--violet)' : 'var(--ink-soft)'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BigCurve({
  curve,
  maxDiff,
}: {
  curve: SimulationParams['curve'];
  maxDiff: number;
}) {
  const gradientId = useId().replace(/:/g, '');
  const width = 440;
  const height = 200;
  const padX = 18;
  const padY = 22;
  const points = curvePoints(curve, maxDiff, 80);
  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${padX + point.x * (width - padX * 2)} ${
          padY + (1 - point.y) * (height - padY * 2)
        }`,
    )
    .join(' ');
  const area = `${path} L ${width - padX} ${height - padY} L ${padX} ${
    height - padY
  } Z`;
  const endpoint = curveRatio(maxDiff);

  return (
    <div className="big-curve-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="big-curve"
        role="img"
        aria-label="Curva de asignación según el puesto en el ranking"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={padX}
            x2={width - padX}
            y1={padY + tick * (height - padY * 2)}
            y2={padY + tick * (height - padY * 2)}
            className="curve-grid-line"
          />
        ))}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          key={`${curve}-${maxDiff}`}
          d={path}
          fill="none"
          stroke="var(--violet)"
          strokeWidth="3"
          strokeLinecap="round"
          className="curve-draw"
        />
        <circle
          cx={padX}
          cy={padY + (1 - 1) * (height - padY * 2)}
          r="4.5"
          fill="var(--violet)"
        />
        <circle
          cx={width - padX}
          cy={padY + (1 - endpoint) * (height - padY * 2)}
          r="4.5"
          fill="var(--violet)"
          opacity="0.7"
        />
        <text x={padX} y={height - 4} className="curve-axis-label">
          1° puesto
        </text>
        <text
          x={width - padX}
          y={height - 4}
          textAnchor="end"
          className="curve-axis-label"
        >
          Último puesto
        </text>
        <text
          x={padX + 8}
          y={padY + 14}
          className="curve-value-label"
        >
          100%
        </text>
        <text
          x={width - padX - 8}
          y={padY + (1 - endpoint) * (height - padY * 2) - 10}
          textAnchor="end"
          className="curve-value-label"
        >
          {formatPercent(endpoint * 100, 0)}
        </text>
      </svg>
      <div className="big-curve-foot">
        <span>
          Primer lugar recibe el 100% de su asignación relativa; el último,{' '}
          <strong>{formatPercent(endpoint * 100, 0)}</strong>.
        </span>
        <span className="panel-note">
          Con diferencia máxima de {formatPercent(maxDiff, 0)}
        </span>
      </div>
    </div>
  );
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
        eyebrow="Paso 3.1 · Parámetros del modelo"
        title="Las reglas finas del mecanismo"
        lede="La Comisión de Becas propone estos cuatro parámetros y la Asamblea los ratifica. Cambiarlos no altera los datos: altera cómo se agrupan, desempatan y reparten los mismos postulantes."
        meta={
          <TypePill tone="violet">
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
              accent="var(--violet)"
            />
          </div>

          <InfoNote icon="sparkles" tone="violet">
            Los parámetros no cambian el fondo ni los datos: solo la forma en
            que se ordena y reparte. Prueba mover la tolerancia para fusionar
            baldes o cambiar la curva para redistribuir los montos.
          </InfoNote>
        </div>
      </div>
    </div>
  );
}
