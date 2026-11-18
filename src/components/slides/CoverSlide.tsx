import { Icon } from '../Icon';
import { TypePill } from '../ui';

const previewRows = [
  { role: 'Resp. Grupo', amount: 100, tone: '#6d28d9' },
  { role: 'Asist. Grupo', amount: 84, tone: '#2563eb' },
  { role: 'Resp. Unidad', amount: 68, tone: '#0f766e' },
  { role: 'Otro cargo', amount: 52, tone: '#b45309' },
];

export function CoverSlide({ onStart }: { onStart: () => void }) {
  return (
    <div className="cover">
      <div className="cover-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          Distrito · Comisión de Becas
        </div>
        <h1>
          Simulador del Sistema de <em>Becas</em> de Formación
        </h1>
        <p className="cover-lede">
          Diez grupos, un fondo común y un mecanismo de priorización. Ajusta
          la aleatoriedad y los parámetros, y recorre cada decisión del sistema
          paso a paso.
        </p>

        <div className="cover-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
            Comenzar simulación
            <Icon name="arrowRight" size={19} />
          </button>
          <span className="cover-footnote">
            <Icon name="check" size={15} />
            Todo se ejecuta en tu navegador
          </span>
        </div>

        <div className="cover-facts">
          <div>
            <strong>10</strong>
            <span>grupos genéricos</span>
          </div>
          <div>
            <strong>4</strong>
            <span>parámetros ajustables</span>
          </div>
          <div>
            <strong>PDF</strong>
            <span>reporte descargable</span>
          </div>
        </div>
      </div>

      <div className="cover-art" aria-hidden="true">
        <div className="glow glow-one" />
        <div className="glow glow-two" />
        <div className="cover-ring" />
        <div className="cover-ring cover-ring-two" />

        <div className="cover-card">
          <div className="cover-card-head">
            <div>
              <span className="mini-label">Vista previa</span>
              <strong>Ranking de asignación</strong>
            </div>
            <TypePill tone="violet">En vivo</TypePill>
          </div>
          <div className="cover-rows">
            {previewRows.map((row, index) => (
              <div className="cover-row" key={row.role}>
                <span className="cover-row-pos">{index + 1}</span>
                <div className="cover-row-body">
                  <div className="cover-row-label">
                    <span>{row.role}</span>
                    <span>{row.amount}%</span>
                  </div>
                  <div className="cover-row-track">
                    <span
                      style={{
                        width: `${row.amount}%`,
                        background: row.tone,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="cover-card-foot">
            <span>Fondo distribuido</span>
            <strong>$ 3.000.000</strong>
          </div>
        </div>

        <div className="floating-card floating-curve">
          <div className="floating-curve-head">
            <span>Curva de asignación</span>
            <span className="live-dot">Ajustable</span>
          </div>
          <svg viewBox="0 0 180 64" role="presentation">
            <defs>
              <linearGradient id="coverCurve" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8a33d" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#e8a33d" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M4 12 C 34 12, 62 26, 92 34 S 146 52, 176 54 L176 62 L4 62 Z"
              fill="url(#coverCurve)"
            />
            <path
              d="M4 12 C 34 12, 62 26, 92 34 S 146 52, 176 54"
              fill="none"
              stroke="#e8a33d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="4" cy="12" r="3.5" fill="#e8a33d" />
            <circle cx="176" cy="54" r="3.5" fill="#e8a33d" />
          </svg>
          <div className="floating-curve-foot">
            <span>1° lugar</span>
            <span>Último lugar</span>
          </div>
        </div>

        <div className="floating-card floating-tie">
          <span className="floating-tie-icon">
            <Icon name="equal" size={17} />
          </span>
          <div>
            <strong>Empates técnicos</strong>
            <span>Mismo monto garantizado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
