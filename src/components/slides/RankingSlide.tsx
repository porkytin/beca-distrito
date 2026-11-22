import { Icon } from '../Icon';
import {
  EmptyState,
  InfoNote,
  Panel,
  RolePill,
  SlideHeading,
  TypePill,
} from '../ui';
import { formatDecimal, formatNumber, formatRatio } from '../../domain/format';
import {
  ROLE_META,
  type Group,
  type RankedApplicant,
  type SimulationParams,
} from '../../domain/types';
import type { SimulationView } from '../../domain/simulation';

interface RankingSlideProps {
  simulation: SimulationView;
  groups: Group[];
  params: SimulationParams;
}

const priorityLadder = [
  {
    label: 'Responsable de Grupo',
    tone: ROLE_META.responsableGrupo.color,
  },
  {
    label: 'Asistente de Grupo',
    tone: ROLE_META.asistenteGrupo.color,
  },
  {
    label: 'Responsable de Unidad',
    tone: ROLE_META.responsableUnidad.color,
  },
  { label: 'Otros cargos', tone: ROLE_META.otro.color },
];

export function RankingSlide({
  simulation,
  groups,
  params,
}: RankingSlideProps) {
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const maxRatio = Math.max(
    ...simulation.ranked.map((member) => member.applicant.groupRatio),
    0.001,
  );
  const tieCount = new Set(
    simulation.ranked
      .map((member) => member.tieId)
      .filter((id): id is string => id !== null),
  ).size;

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Simulación · Segundo ordenamiento"
        title="Cargo, impacto en el Grupo y empates"
        lede="Dentro de cada balde socioeconómico, el orden se define por el cargo vigente. Si dos personas tienen el mismo cargo, se prioriza a quien pertenece al Grupo con menor ratio de Nivel Medio por NNJ. Si la diferencia es mínima, el empate se mantiene y recibirán el mismo monto."
      />

      <div className="rank-rules">
        <div className="rank-rule card">
          <span className="rule-number">1</span>
          <div>
            <strong>Cargo vigente</strong>
            <div className="priority-ladder">
              {priorityLadder.map((item, index) => (
                <span key={item.label} className="priority-step">
                  <span
                    className="priority-dot"
                    style={{ background: item.tone }}
                  />
                  {item.label}
                  {index < priorityLadder.length - 1 && (
                    <Icon name="chevronRight" size={12} />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="rank-rule card">
          <span className="rule-number">2</span>
          <div>
            <strong>Necesidad formativa</strong>
            <p>
              Menor ratio <b>Nivel Medio / NNJ</b> del Grupo. Un Grupo con menos
              adultos formados recibe prioridad.
            </p>
            <span className="rule-threshold">
              Umbral de diferencia: {formatDecimal(params.minRatioDiff, 3)}
            </span>
          </div>
        </div>
        <div className="rank-rule card">
          <span className="rule-number">3</span>
          <div>
            <strong>Empate técnico</strong>
            <p>
              Si la diferencia de ratios es menor al umbral, se declara empate.
              El orden alfabético solo define la posición en la tabla; el monto
              se iguala.
            </p>
            <TypePill tone="amber">
              <Icon name="equal" size={13} />
              Mismo monto garantizado
            </TypePill>
          </div>
        </div>
      </div>

      <Panel
        title="Ranking definitivo"
        icon="list"
        className="table-panel ranking-panel"
        aside={
          <span className="panel-note">
            {formatNumber(simulation.ranked.length)}{' '}
            {simulation.ranked.length === 1 ? 'postulante' : 'postulantes'} ·{' '}
            {formatNumber(simulation.buckets.length)}{' '}
            {simulation.buckets.length === 1 ? 'balde' : 'baldes'} ·{' '}
            {formatNumber(tieCount)}{' '}
            {tieCount === 1 ? 'empate técnico' : 'empates técnicos'}
          </span>
        }
      >
        {simulation.ranked.length === 0 ? (
          <EmptyState title="Todavía no hay ranking" icon="list">
            No hay postulantes admisibles. Revisa la regularidad de los Grupos o
            genera nuevas postulaciones.
          </EmptyState>
        ) : (
          <div className="table-scroll ranking-scroll">
            <table className="data-table ranking-table">
              <thead>
                <tr>
                  <th className="rank-col">Puesto</th>
                  <th>Postulante</th>
                  <th>Grupo</th>
                  <th>Balde RSH</th>
                  <th>Cargo</th>
                  <th>Ratio del Grupo</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {simulation.ranked.map((member: RankedApplicant, index) => {
                  const group = groupMap.get(member.applicant.groupId);
                  return (
                    <tr
                      key={member.applicant.id}
                      className={member.tieId ? 'is-tie' : ''}
                      style={{
                        animationDelay: `${Math.min(index, 20) * 35}ms`,
                      }}
                    >
                      <td className="rank-col">
                        <span className="rank-badge">
                          {member.position}
                        </span>
                      </td>
                      <td>
                        <span className="applicant-name">
                          {member.applicant.label}
                        </span>
                      </td>
                      <td>
                        <span className="group-name">
                          <span
                            className="group-dot"
                            style={{ background: group?.color }}
                          />
                          {group?.name}
                        </span>
                      </td>
                      <td>
                        <span className="bucket-cell">
                          <span className="bucket-tag">
                            B{member.bucketIndex + 1}
                          </span>
                          <span className="rsh-value">{member.applicant.rsh}</span>
                        </span>
                      </td>
                      <td>
                        <RolePill role={member.applicant.role} />
                      </td>
                      <td>
                        <div className="ratio-cell">
                          <div className="ratio-track">
                            <span
                              style={{
                                width: `${Math.min(
                                  100,
                                  (member.applicant.groupRatio / maxRatio) * 100,
                                )}%`,
                                background: group?.color,
                              }}
                            />
                          </div>
                          <span className="ratio-value">
                            {formatRatio(member.applicant.groupRatio)}
                          </span>
                        </div>
                      </td>
                      <td>
                        {member.tieId ? (
                          <span className="tie-badge">
                            <Icon name="equal" size={13} />
                            Empate técnico
                          </span>
                        ) : (
                          <span className="ordered-note">
                            <Icon name="check" size={13} />
                            Ordenado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <InfoNote icon="info" tone="amber">
        El empate técnico no se resuelve arbitrariamente: quienes persisten
        empatados se ordenan por su identificador solo para efectos de la tabla y
        luego reciben exactamente el mismo monto de beca en la asignación.
      </InfoNote>
    </div>
  );
}
