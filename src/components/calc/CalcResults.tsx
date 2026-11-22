import { Icon } from '../Icon';
import {
  EmptyState,
  InfoNote,
  Panel,
  RolePill,
  Stat,
  TypePill,
} from '../ui';
import {
  formatCLP,
  formatNumber,
  formatPercent,
  formatRatio,
} from '../../domain/format';
import { ROLE_META } from '../../domain/types';
import type { SimulationView } from '../../domain/simulation';
import type { SimulationParams } from '../../domain/types';

interface CalcResultsProps {
  simulation: SimulationView;
  params: SimulationParams;
  downloading: boolean;
  downloadError: string | null;
  onDownload: () => void;
  onExportCsv: () => void;
}

export function CalcResults({
  simulation,
  params,
  downloading,
  downloadError,
  onDownload,
  onExportCsv,
}: CalcResultsProps) {
  const { allocation, ranked, summaries } = simulation;
  const groupMap = new Map(
    simulation.groups.map((group) => [group.id, group]),
  );
  const noDemand = ranked.length === 0;
  const coverage =
    allocation.totalRequested > 0
      ? Math.min(100, allocation.coverage * 100)
      : 0;
  const allocatedCount = allocation.amounts.filter(
    (amount) => amount > 0,
  ).length;

  return (
    <div className="calc-results">
      <div className="result-toolbar">
        <div>
          <h2>Resultado del cálculo</h2>
          <p>
            {noDemand
              ? 'No hay postulaciones admisibles con los datos actuales.'
              : allocation.caseA
                ? 'El fondo cubre el costo completo de todas las postulaciones admisibles.'
                : 'El fondo se distribuye según el ranking y la curva seleccionada.'}
          </p>
        </div>
        <div className="result-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onExportCsv}
            disabled={noDemand}
          >
            <Icon name="download" size={16} />
            Exportar CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <span className="spinner" />
                Generando PDF…
              </>
            ) : (
              <>
                <Icon name="file" size={16} />
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {downloadError && <p className="download-error">{downloadError}</p>}

      {!noDemand && (params.budget === 0 || params.courseCost === 0) && (
        <InfoNote icon="info" tone="amber">
          Completa el fondo anual y el costo del Curso Medio en la pestaña
          Parámetros para obtener los montos de la asignación.
        </InfoNote>
      )}

      <div className="stat-strip">
        <Stat
          label="Fondo disponible"
          value={formatCLP(allocation.budget)}
          icon="coins"
          hint="Monto ingresado"
        />
        <Stat
          label="Demanda admisible"
          value={formatCLP(allocation.totalRequested)}
          icon="users"
          hint={`${formatNumber(ranked.length)} × ${formatCLP(params.courseCost)}`}
        />
        <Stat
          label="Monto asignado"
          value={formatCLP(allocation.totalAssigned)}
          icon="target"
          hint={`${formatNumber(allocatedCount)} becas con monto`}
          accent="var(--accent)"
        />
        <Stat
          label="Cobertura"
          value={noDemand ? '—' : formatPercent(coverage, 0)}
          icon="scale"
          hint={
            allocation.spread === null
              ? 'Sin brecha calculada'
              : `Brecha real: ${formatPercent(allocation.spread, 0)}`
          }
          accent="var(--amber)"
        />
      </div>

      <Panel
        title="Ranking y asignación"
        icon="list"
        className="table-panel"
        aside={
          <span className="panel-note">
            {formatNumber(ranked.length)}{' '}
            {ranked.length === 1 ? 'postulante' : 'postulantes'} ·{' '}
            {formatNumber(simulation.buckets.length)}{' '}
            {simulation.buckets.length === 1 ? 'balde' : 'baldes'}
          </span>
        }
      >
        {noDemand ? (
          <EmptyState title="No hay postulaciones admisibles" icon="list">
            Revisa la regularidad de los Grupos y la nómina de postulaciones en
            la pestaña Datos.
          </EmptyState>
        ) : (
          <div className="table-scroll ranking-scroll">
            <table className="data-table ranking-table result-table">
              <thead>
                <tr>
                  <th className="rank-col">Puesto</th>
                  <th>Postulante</th>
                  <th>Grupo</th>
                  <th>Cargo</th>
                  <th className="num">RSH</th>
                  <th>Balde</th>
                  <th className="num">Ratio</th>
                  <th>Empate</th>
                  <th className="num">Monto</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((member, index) => {
                  const group = groupMap.get(member.applicant.groupId);
                  return (
                    <tr
                      key={member.applicant.id}
                      className={member.tieId ? 'is-tie' : ''}
                    >
                      <td className="rank-col">
                        <span className="rank-badge">{member.position}</span>
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
                          {group?.name ?? '—'}
                        </span>
                      </td>
                      <td>
                        <RolePill role={member.applicant.role} />
                      </td>
                      <td className="num">
                        <span className="rsh-value">{member.applicant.rsh}</span>
                      </td>
                      <td>
                        <span className="bucket-tag">
                          B{member.bucketIndex + 1}
                        </span>
                      </td>
                      <td className="num">
                        {formatRatio(member.applicant.groupRatio)}
                      </td>
                      <td>
                        {member.tieId ? (
                          <span className="tie-badge">
                            <Icon name="equal" size={12} />
                            Empate
                          </span>
                        ) : (
                          <span className="ordered-note">—</span>
                        )}
                      </td>
                      <td className="num amount-cell">
                        {formatCLP(allocation.amounts[index] ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {allocation.tieGroups.length > 0 && (
        <Panel title="Empates técnicos" icon="equal">
          <div className="tie-list">
            {allocation.tieGroups.map((tie) => (
              <div className="tie-group" key={tie.id}>
                <div className="tie-group-head">
                  <span className="tie-group-title">
                    <Icon name="equal" size={14} />
                    {tie.members.length} postulantes
                  </span>
                  <strong>{formatCLP(tie.amount)} por persona</strong>
                </div>
                <div className="tie-members">
                  {tie.members.map((member) => (
                    <span key={member.applicant.id} className="tie-member">
                      {member.applicant.label}
                      <small> · {ROLE_META[member.applicant.role].short}</small>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Resultado por Grupo"
        icon="group"
        className="table-panel"
        aside={
          <span className="panel-note">
            {formatNumber(summaries.length)} Grupos
          </span>
        }
      >
        {summaries.length === 0 ? (
          <EmptyState title="No hay Grupos registrados" icon="group">
            Agrega la dotación de los Grupos en la pestaña Datos para ver el
            resultado por Grupo.
          </EmptyState>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Regularidad</th>
                  <th className="num">NNJ</th>
                  <th className="num">Nivel Medio</th>
                  <th className="num">Ratio</th>
                  <th className="num">Postulaciones</th>
                  <th className="num">Admisibles</th>
                  <th className="num">Becas</th>
                  <th className="num">Asignado</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr key={summary.group.id}>
                    <td>
                      <span className="group-name">
                        <span
                          className="group-dot"
                          style={{ background: summary.group.color }}
                        />
                        {summary.group.name}
                      </span>
                    </td>
                    <td>
                      <TypePill
                        tone={summary.group.regular ? 'green' : 'rose'}
                      >
                        {summary.group.regular ? 'Regular' : 'Irregular'}
                      </TypePill>
                    </td>
                    <td className="num">{formatNumber(summary.group.nnj)}</td>
                    <td className="num">
                      {formatNumber(summary.group.nivelMedio)}
                    </td>
                    <td className="num">{formatRatio(summary.group.ratio)}</td>
                    <td className="num">
                      {formatNumber(summary.applicantCount)}
                    </td>
                    <td className="num">
                      {formatNumber(summary.admissibleCount)}
                    </td>
                    <td className="num">
                      {formatNumber(summary.allocatedCount)}
                    </td>
                    <td className="num amount-cell">
                      {formatCLP(summary.allocatedTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <InfoNote icon="info">
        El PDF y el CSV se generan en este navegador. El resultado aplica los
        parámetros ingresados; la Comisión de Becas revisa y aplica la
        asignación conforme al reglamento.
      </InfoNote>
    </div>
  );
}
