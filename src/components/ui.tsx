import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { ROLE_META, type Role } from '../domain/types';

export function SlideHeading({
  eyebrow,
  title,
  lede,
  meta,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  meta?: ReactNode;
}) {
  return (
    <header className="slide-heading">
      <div className="eyebrow">
        <span className="eyebrow-dot" />
        {eyebrow}
      </div>
      <h2>{title}</h2>
      {lede && <p className="lede">{lede}</p>}
      {meta && <div className="heading-meta">{meta}</div>}
    </header>
  );
}

export function Panel({
  title,
  icon,
  aside,
  children,
  className = '',
}: {
  title?: string;
  icon?: IconName;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card panel ${className}`.trim()}>
      {(title || aside) && (
        <div className="panel-head">
          <div className="panel-title">
            {icon && (
              <span className="panel-icon">
                <Icon name={icon} size={16} />
              </span>
            )}
            {title}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  accent,
  className = '',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={`stat ${className}`.trim()}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && (
          <span
            className="stat-icon"
            style={accent ? { color: accent } : undefined}
          >
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>
      <div className="stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  hint,
  compact = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
  compact?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  const clampValue = (next: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, next));

  const commit = () => {
    if (draft === null) return;

    const raw = draft.trim().replace(',', '.');
    const parsed = Number(raw);

    if (raw === '' || Number.isNaN(parsed)) {
      setDraft(null);
      return;
    }

    const next = clampValue(parsed);
    setDraft(null);

    if (next !== value) {
      onChange(next);
    }
  };

  const handleChange = (raw: string) => {
    if (raw === '') {
      setDraft('');
      return;
    }

    // Un cero a la izquierda no aporta valor (05 → 5), pero se conserva en 0.
    const cleaned = raw.replace(/^0+(?=\d)/, '');
    const parsed = Number(cleaned.replace(',', '.'));

    if (Number.isNaN(parsed)) {
      setDraft(cleaned);
      return;
    }

    setDraft(cleaned);

    const next = clampValue(parsed);
    if (next !== value) {
      onChange(next);
    }
  };

  return (
    <div className={`field ${compact ? 'field-compact' : ''}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={draft ?? String(value)}
          min={min}
          max={max}
          step={step}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  hint,
  accent,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format: (value: number) => string;
  hint?: string;
  accent?: string;
}) {
  const id = useId();
  const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className="field range-field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        <output
          htmlFor={id}
          className="field-value"
          style={{ color: accent ?? 'var(--violet)' }}
        >
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={
          {
            '--fill': `${percentage}%`,
            '--range-accent': accent ?? 'var(--violet)',
          } as CSSProperties
        }
      />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function RangePair({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field range-pair-field">
      <span className="field-label">{label}</span>
      <div className="range-pair">{children}</div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  tone = 'good',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <button
      type="button"
      className={`switch ${checked ? 'is-on' : 'is-off'} tone-${tone}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-thumb" />
    </button>
  );
}

export function RolePill({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return (
    <span
      className="role-pill"
      style={{ color: meta.color, background: meta.soft }}
    >
      <span className="role-dot" style={{ background: meta.color }} />
      {meta.short}
    </span>
  );
}

export function StatusPill({ regular }: { regular: boolean }) {
  return (
    <span className={`status-pill ${regular ? 'is-regular' : 'is-irregular'}`}>
      <span className="status-dot" />
      {regular ? 'Regular' : 'Irregular'}
    </span>
  );
}

export function TypePill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'violet' | 'green' | 'amber' | 'rose';
}) {
  return <span className={`type-pill tone-${tone}`}>{children}</span>;
}

export function InfoNote({
  children,
  icon = 'info',
  tone = 'neutral',
}: {
  children: ReactNode;
  icon?: IconName;
  tone?: 'neutral' | 'violet' | 'amber' | 'green';
}) {
  return (
    <div className={`info-note tone-${tone}`}>
      <Icon name={icon} size={17} />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  icon = 'users',
}: {
  title: string;
  children: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={26} />
      </span>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
