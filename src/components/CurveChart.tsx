import { useId } from 'react';
import { curvePoints, curveRatio } from '../domain/allocation';
import { formatPercent } from '../domain/format';
import type { CurveType } from '../domain/types';

export function MiniCurve({
  curve,
  maxDiff,
  selected,
}: {
  curve: CurveType;
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
        fill={selected ? 'rgba(31, 78, 121, 0.1)' : 'rgba(30, 41, 59, 0.045)'}
      />
      <path
        d={path}
        fill="none"
        stroke={selected ? 'var(--accent)' : 'var(--ink-soft)'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BigCurve({
  curve,
  maxDiff,
}: {
  curve: CurveType;
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
            <stop offset="0%" stopColor="#1f4e79" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1f4e79" stopOpacity="0.015" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx={padX}
          cy={padY + (1 - 1) * (height - padY * 2)}
          r="4"
          fill="var(--accent)"
        />
        <circle
          cx={width - padX}
          cy={padY + (1 - endpoint) * (height - padY * 2)}
          r="4"
          fill="var(--accent)"
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
        <text x={padX + 8} y={padY + 14} className="curve-value-label">
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
          Primer lugar: 100% de su asignación relativa. Último lugar:{' '}
          <strong>{formatPercent(endpoint * 100, 0)}</strong>.
        </span>
        <span className="panel-note">
          Diferencia relativa máxima: {formatPercent(maxDiff, 0)}
        </span>
      </div>
    </div>
  );
}
