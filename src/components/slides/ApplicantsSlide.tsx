import {
  InfoNote,
  NumberField,
  Panel,
  RangeField,
  RangePair,
  RolePill,
  SlideHeading,
} from '../ui';
import { Icon } from '../Icon';
import { formatNumber, formatPercent, formatRatio } from '../../domain/format';
import {
  ROLES,
  ROLE_META,
  type Applicant,
  type Group,
  type RandomConfig,
} from '../../domain/types';

interface ApplicantsSlideProps {
  random: RandomConfig;
  updateRandom: (patch: Partial<RandomConfig>) => void;
  groups: Group[];
  applicants: Applicant[];
}

export function ApplicantsSlide({
  random,
  updateRandom,
  groups,
  applicants,
}: ApplicantsSlideProps) {
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const weightTotal = ROLES.reduce(
    (sum, role) => sum + Math.max(0, random.roleWeights[role]),
    0,
  );
  const roleCounts = new Map(
    ROLES.map((role) => [
      role,
      applicants.filter((applicant) => applicant.role === role).length,
    ]),
  );
  const averageRsh =
    applicants.length > 0
      ? applicants.reduce((sum, applicant) => sum + applicant.rsh, 0) /
        applicants.length
      : 0;

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Simulación · Postulaciones"
        title="Postulaciones y percentil RSH"
        lede="Cada postulante tiene un percentil del Registro Social de Hogares y un cargo vigente. El percentil RSH se interpreta de 0 a 100: un valor menor corresponde a mayor vulnerabilidad socioeconómica."
      />

      <div className="data-layout">
        <aside className="data-sidebar">
          <Panel
            title="Parámetros de las postulaciones"
            icon="sliders"
            aside={<span className="panel-note">Datos generados</span>}
          >
            <div className="control-stack">
              <RangePair
                label="Percentil RSH"
                hint="0 = mayor vulnerabilidad · 100 = menor vulnerabilidad"
              >
                <NumberField
                  compact
                  label="Mín."
                  value={random.rshMin}
                  min={0}
                  max={100}
                  onChange={(value) => updateRandom({ rshMin: value })}
                />
                <NumberField
                  compact
                  label="Máx."
                  value={random.rshMax}
                  min={0}
                  max={100}
                  onChange={(value) => updateRandom({ rshMax: value })}
                />
              </RangePair>

              <RangeField
                label="Concentración en mayor vulnerabilidad"
                value={random.rshConcentration}
                min={0}
                max={100}
                step={5}
                onChange={(value) =>
                  updateRandom({ rshConcentration: value })
                }
                format={(value) =>
                  value === 0 ? 'Uniforme' : formatPercent(value)
                }
                hint="Sesga los percentiles hacia el extremo más vulnerable."
              />

              <div className="weight-block">
                <div className="field-head">
                  <span className="field-label">Peso relativo de los cargos</span>
                  <span className="field-value">100%</span>
                </div>
                <div className="weight-list">
                  {ROLES.map((role) => {
                    const meta = ROLE_META[role];
                    const share =
                      weightTotal > 0
                        ? (Math.max(0, random.roleWeights[role]) /
                            weightTotal) *
                          100
                        : 25;
                    return (
                      <RangeField
                        key={role}
                        label={meta.label}
                        value={random.roleWeights[role]}
                        min={0}
                        max={100}
                        step={5}
                        onChange={(value) =>
                          updateRandom({
                            roleWeights: {
                              ...random.roleWeights,
                              [role]: value,
                            },
                          })
                        }
                        format={() => formatPercent(share)}
                        accent={meta.color}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </Panel>

          <InfoNote icon="info">
            Los cargos se asignan con estos pesos. Un Grupo puede tener a lo más
            un Responsable de Grupo y un Asistente de Grupo.
          </InfoNote>
        </aside>

        <div className="data-main">
          <div className="rsh-card card">
            <div className="rsh-card-head">
              <div>
                <span className="mini-label">Distribución de vulnerabilidad</span>
                <strong>
                  {formatNumber(applicants.length)} postulaciones · RSH promedio{' '}
                  {formatNumber(averageRsh)}
                </strong>
              </div>
              <div className="role-legend">
                {ROLES.map((role) => (
                  <span key={role} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: ROLE_META[role].color }}
                    />
                    {ROLE_META[role].short}
                    <b>{roleCounts.get(role) ?? 0}</b>
                  </span>
                ))}
              </div>
            </div>
            <div className="rsh-track-wrap">
              <div className="rsh-axis rsh-axis-top">
                <span>0 · mayor vulnerabilidad</span>
                <span>50</span>
                <span>100 · menor vulnerabilidad</span>
              </div>
              <div className="rsh-track" aria-hidden="true">
                <div className="rsh-grid">
                  <span style={{ left: '0%' }} />
                  <span style={{ left: '25%' }} />
                  <span style={{ left: '50%' }} />
                  <span style={{ left: '75%' }} />
                  <span style={{ left: '100%' }} />
                </div>
                {applicants.map((applicant, index) => {
                  const meta = ROLE_META[applicant.role];
                  return (
                    <span
                      key={applicant.id}
                      className="rsh-dot"
                      title={`${applicant.label} · ${groupMap.get(applicant.groupId)?.name} · RSH ${applicant.rsh} · ${meta.label}`}
                      style={{
                        left: `calc(14px + (100% - 28px) * ${applicant.rsh / 100})`,
                        top: `${9 + (index % 3) * 13}px`,
                        background: meta.color,
                        animationDelay: `${index * 22}ms`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <Panel
            title="Nómina de postulaciones"
            icon="file"
            className="table-panel applicants-panel"
            aside={
              <span className="panel-note">
                Ordenadas por Grupo · {formatNumber(applicants.length)} en total
              </span>
            }
          >
            {applicants.length === 0 ? (
              <div className="empty-state compact">
                <span className="empty-icon">
                  <Icon name="users" size={24} />
                </span>
                <strong>No hay postulaciones</strong>
                <p>Ajusta el máximo de postulaciones por Grupo en la sección anterior.</p>
              </div>
            ) : (
              <div className="table-scroll applicants-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Postulante</th>
                      <th>Grupo</th>
                      <th>Cargo</th>
                      <th className="num">RSH</th>
                      <th className="num">Ratio del Grupo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((applicant) => {
                      const group = groupMap.get(applicant.groupId);
                      return (
                        <tr key={applicant.id}>
                          <td>
                            <span className="applicant-name">
                              {applicant.label}
                            </span>
                          </td>
                          <td>
                            <span className="group-name">
                              <span
                                className="group-dot"
                                style={{ background: group?.color }}
                              />
                              {group?.name ?? '—'}
                            </span>
                          </td>
                          <td>
                            <RolePill role={applicant.role} />
                          </td>
                          <td className="num">
                            <span className="rsh-value">{applicant.rsh}</span>
                          </td>
                          <td className="num">
                            {formatRatio(applicant.groupRatio)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
