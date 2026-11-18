import { Icon } from '../Icon';
import {
  EmptyState,
  InfoNote,
  Panel,
  SlideHeading,
  Stat,
  TypePill,
} from '../ui';
import { useAnimatedNumber } from '../../hooks';
import {
  formatCLP,
  formatNumber,
  formatPercent,
  formatRatio,
} from '../../domain/format';
import { ROLE_META, ROLES, type Group, type SimulationParams } from '../../domain/types';
import type { SimulationView } from '../../domain/simulation';

interface AllocationSlideProps {
  simulation: SimulationView;
  groups: Group[];
  params: SimulationParams;
}

function compactCLP(value: number): string {
  if (value >= 1_000_000) {
    return `$${value
      .toLocaleString('es-CL', { maximumFractionDigits: 1 })
      .replace(/,0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`;
  }
  return `$${Math.round(value)}`;
}

export function AllocationSlide({
  simulation,
  groups,
  params,
}: AllocationSlideProps) {
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const { allocation, ranked } = simulation;
  const assigned = useAnimatedNumber(allocation.totalAssigned);
  const requested = useAnimatedNumber(allocation.totalRequested);
  const budget = useAnimatedNumber(allocation.budget);
  const offers = allocation.amounts.filter((amount) => amount > 0).length;
  const maxGroupTotal = Math.max(
    ...simulation.summaries.map((summary) => summary.allocatedTotal),
    1,
  );
  const showLabels = ranked.length <= 14;
  const noDemand = ranked.length === 0;

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Paso 3.2 · Asignación de fondos"
        title="Del ranking al monto de cada beca"
        lede={
          noDemand
            ? 'No hay postulantes admisibles en este escenario, por lo que el fondo queda sin asignar. Revisa la regularidad de los Grupos o genera nuevas postulaciones.'
            : allocation.caseA
              ? 'El fondo alcanza para cubrir todas las postulaciones admisibles: cada persona recibe el 100% del costo del Curso Medio.'
              : 'El fondo no alcanza para el 100%. Los montos decrecen según el puesto del ranking, respetando la diferencia relativa máxima, y los empates técnicos se reparten en partes iguales.'
        }
        meta={
          noDemand ? (
            <TypePill tone="rose">Sin demanda admisible</TypePill>
          ) : (
            <>
              <TypePill tone={allocation.caseA ? 'green' : 'amber'}>
                {allocation.caseA
                  ? 'Caso A · Fondos suficientes'
                  : 'Caso B · Fondos insuficientes'}
              </TypePill>
              <TypePill tone="neutral">
                <Icon name="check" size={13} />
                Asignación aplicada por la Comisión de Becas
              </TypePill>
            </>
          )
        }
      />

      <div className="stat-strip alloc-stats">
        <Stat
          label="Fondo disponible"
          value={formatCLP(budget)}
          icon="coins"
          hint="Aprobado por la Asamblea"
        />
        <Stat
          label="Solicitado admisible"
          value={formatCLP(requested)}
          icon="file"
          hint={`${formatNumber(ranked.length)} ${
            ranked.length === 1 ? 'postulante' : 'postulantes'
          } × ${formatCLP(params.courseCost)}`}
        />
        <Stat
          label="Monto asignado"
          value={formatCLP(assigned)}
          icon="target"
          hint={`${formatNumber(offers)} ${
            offers === 1 ? 'beca con monto' : 'becas con monto'
          }`}
          accent="var(--violet)"
        />
        <Stat
          label="Brecha real"
          value={
            allocation.spread === null
              ? '—'
              : formatPercent(allocation.spread, 0)
          }
          icon="scale"
          hint="1° lugar vs. último lugar"
          accent="var(--amber)"
        />
      </div>

      {ranked.length === 0 ? (
        <div className="card">
          <EmptyState title="No hay asignaciones" icon="coins">
            No existen postulantes admisibles para asignar. Revisa la
            regularidad de los Grupos o el fondo disponible.
          </EmptyState>
        </div>
      ) : (
        <>
          <Panel
            title="Asignación por puesto del ranking"
            icon="trophy"
            className="alloc-chart-panel"
            aside={
              <div className="role-legend alloc-legend">
                {ROLES.map((role) => (
                  <span key={role} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: ROLE_META[role].color }}
                    />
                    {ROLE_META[role].short}
                  </span>
                ))}
                <span className="legend-item">
                  <span className="tie-key">
                    <Icon name="equal" size={11} />
                  </span>
                  Empate
                </span>
              </div>
            }
          >
            <div className="alloc-chart">
              <div className="alloc-axis">
                <span>{formatCLP(params.courseCost)}</span>
                <span>{formatCLP(params.courseCost / 2)}</span>
                <span>$ 0</span>
              </div>
              <div className="alloc-plot">
                <div className="alloc-grid">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="alloc-bars">
                  {ranked.map((member, index) => {
                    const amount = allocation.amounts[index] ?? 0;
                    const role = ROLE_META[member.applicant.role];
                    const group = groupMap.get(member.applicant.groupId);
                    const height =
                      params.courseCost > 0
                        ? Math.min(100, (amount / params.courseCost) * 100)
                        : 0;
                    return (
                      <div
                        key={member.applicant.id}
                        className={`alloc-col ${member.tieId ? 'is-tie' : ''}`}
                        title={`${member.position}° · ${member.applicant.label} · ${
                          group?.name
                        } · ${role.label} · ${formatCLP(amount)}`}
                      >
                        <div className="alloc-bar-slot">
                          {showLabels && amount > 0 && (
                            <span className="alloc-amount">
                              {compactCLP(amount)}
                            </span>
                          )}
                          <div
                            className="alloc-bar"
                            style={{
                              height: `${Math.max(amount > 0 ? 1.5 : 0, height)}%`,
                              background: `linear-gradient(180deg, ${role.color}, ${role.color}cc)`,
                              animationDelay: `${Math.min(index, 24) * 32}ms`,
                            }}
                          />
                        </div>
                        <span className="alloc-pos">{member.position}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="alloc-chart-foot">
              <span>
                El alto de cada barra es el monto asignado; el máximo posible es
                el costo del curso ({formatCLP(params.courseCost)}).
              </span>
              <span className="panel-note">
                Pasa el cursor sobre una barra para ver el detalle.
              </span>
            </div>
          </Panel>

          <div className="alloc-lower">
            <Panel title="Empates técnicos" icon="equal">
              {allocation.tieGroups.length === 0 ? (
                <div className="no-ties">
                  <span className="no-ties-icon">
                    <Icon name="check" size={18} />
                  </span>
                  <div>
                    <strong>Sin empates técnicos</strong>
                    <p>
                      Ningún grupo de postulantes quedó empatado tras aplicar el
                      umbral de ratio.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="tie-list">
                  {allocation.tieGroups.map((tie) => (
                    <div className="tie-group" key={tie.id}>
                      <div className="tie-group-head">
                        <span className="tie-group-title">
                          <Icon name="equal" size={14} />
                          Empate técnico
                        </span>
                        <strong>{formatCLP(tie.amount)}</strong>
                      </div>
                      <div className="tie-members">
                        {tie.members.map((member) => (
                          <span key={member.applicant.id} className="tie-member">
                            {member.applicant.label}
                          </span>
                        ))}
                      </div>
                      <p>
                        Se sumaron los montos preliminares de sus posiciones y se
                        dividieron en partes iguales.
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="alloc-ratio-note">
                <span>Diferencia máxima configurada</span>
                <strong>{formatPercent(params.maxDiff, 0)}</strong>
              </div>
            </Panel>

            <Panel
              title="Reparto por Grupo"
              icon="group"
              aside={
                <span className="panel-note">
                  {formatCLP(allocation.totalAssigned)} en total
                </span>
              }
            >
              <div className="group-alloc-list">
                {simulation.summaries.map((summary) => (
                  <div className="group-alloc-row" key={summary.group.id}>
                    <div className="group-alloc-label">
                      <span className="group-name">
                        <span
                          className="group-dot"
                          style={{ background: summary.group.color }}
                        />
                        {summary.group.name}
                      </span>
                      <span className="group-alloc-meta">
                        {formatRatio(summary.group.ratio)} ·{' '}
                        {summary.allocatedCount} beca
                        {summary.allocatedCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="group-alloc-track">
                      <span
                        style={{
                          width: `${(summary.allocatedTotal / maxGroupTotal) * 100}%`,
                          background: summary.group.color,
                        }}
                      />
                    </div>
                    <span className="group-alloc-amount">
                      {formatCLP(summary.allocatedTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      <InfoNote icon="info" tone={allocation.caseA ? 'green' : 'amber'}>
        {noDemand
          ? 'No hay postulantes admisibles: el fondo no se asigna y queda disponible para el siguiente ciclo.'
          : allocation.caseA
            ? 'Como el fondo alcanza, no se aplica la curva decreciente y no hay diferencia entre el primer y el último lugar.'
            : 'El reparto respeta el tope del costo del curso: nadie puede recibir más de lo que cuesta su formación. Los montos se muestran en pesos.'}
      </InfoNote>
    </div>
  );
}
