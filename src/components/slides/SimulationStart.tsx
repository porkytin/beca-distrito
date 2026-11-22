import { Icon } from '../Icon';
import { InfoNote, Panel } from '../ui';
import {
  formatCLP,
  formatDecimal,
  formatNumber,
} from '../../domain/format';
import {
  CURVE_META,
  type RandomConfig,
  type SimulationParams,
} from '../../domain/types';

export function SimulationStart({
  random,
  params,
  groups,
  applicants,
  regularGroups,
  onStart,
  onShowRules,
}: {
  random: RandomConfig;
  params: SimulationParams;
  groups: number;
  applicants: number;
  regularGroups: number;
  onStart: () => void;
  onShowRules: () => void;
}) {
  return (
    <div className="sim-start">
      <header className="sim-start-head">
        <span className="eyebrow">Simulación · Resumen</span>
        <h1>Simulación del mecanismo</h1>
        <p>
          El recorrido muestra cómo se aplican las reglas de admisibilidad,
          ordenamiento y asignación sobre un conjunto de datos generado. La
          semilla permite reproducir el mismo escenario.
        </p>
      </header>

      <div className="sim-start-grid">
        <Panel title="Escenario" icon="shuffle">
          <dl className="summary-list">
            <div>
              <dt>Semilla</dt>
              <dd>{random.seed}</dd>
            </div>
            <div>
              <dt>Grupos</dt>
              <dd>{formatNumber(groups)}</dd>
            </div>
            <div>
              <dt>Postulaciones</dt>
              <dd>{formatNumber(applicants)}</dd>
            </div>
            <div>
              <dt>Grupos regulares</dt>
              <dd>
                {formatNumber(regularGroups)} / {formatNumber(groups)}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Parámetros del modelo" icon="sliders">
          <dl className="summary-list">
            <div>
              <dt>Fondo</dt>
              <dd>{formatCLP(params.budget)}</dd>
            </div>
            <div>
              <dt>Costo del Curso Medio</dt>
              <dd>{formatCLP(params.courseCost)}</dd>
            </div>
            <div>
              <dt>Tolerancia RSH</dt>
              <dd>{formatDecimal(params.tolerance, 1)} pp</dd>
            </div>
            <div>
              <dt>Curva</dt>
              <dd>{CURVE_META[params.curve].label}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <div className="sim-start-steps">
        <strong>Secciones del recorrido</strong>
        <ol>
          <li>Grupos y dotación</li>
          <li>Postulaciones y RSH</li>
          <li>Fondo y costo</li>
          <li>Regularidad</li>
          <li>Parámetros</li>
          <li>Baldes</li>
          <li>Ranking</li>
          <li>Asignación</li>
          <li>Informe</li>
        </ol>
      </div>

      <div className="sim-start-actions">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Comenzar recorrido
          <Icon name="arrowRight" size={17} />
        </button>
        <button type="button" className="btn btn-secondary" onClick={onShowRules}>
          <Icon name="scale" size={16} />
          Ver reglas
        </button>
      </div>

      <InfoNote icon="info">
        Los datos de la simulación son ficticios y se generan localmente. No se
        usan nombres ni antecedentes de personas reales.
      </InfoNote>
    </div>
  );
}
