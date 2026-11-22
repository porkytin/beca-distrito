import { useState } from 'react';
import { Icon } from '../Icon';
import {
  EmptyState,
  InfoNote,
  Panel,
  ToggleSwitch,
} from '../ui';
import { formatNumber, formatRatio } from '../../domain/format';
import {
  ROLES,
  ROLE_META,
  type Applicant,
  type Group,
} from '../../domain/types';
import { clamp } from '../../domain/random';
import type { CalculationActions } from '../../useCalculation';

interface CalcDataProps {
  groups: Group[];
  applicants: Applicant[];
  actions: CalculationActions;
}

function InlineNumber({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(',', '.'));
    setDraft(null);
    if (draft === '' || Number.isNaN(parsed)) return;
    onChange(clamp(Math.round(parsed), min, max));
  };

  return (
    <input
      className="table-input table-number"
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={min}
      max={max}
      step={1}
      value={draft ?? String(value)}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw === '') {
          setDraft('');
          return;
        }
        const parsed = Number(raw.replace(',', '.'));
        if (Number.isNaN(parsed)) {
          setDraft(raw);
          return;
        }
        setDraft(raw);
        onChange(clamp(Math.round(parsed), min, max));
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
}

export function CalcData({ groups, applicants, actions }: CalcDataProps) {
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const applicantsByGroup = new Map<number, number>();
  for (const applicant of applicants) {
    applicantsByGroup.set(
      applicant.groupId,
      (applicantsByGroup.get(applicant.groupId) ?? 0) + 1,
    );
  }

  const handleRemoveGroup = (group: Group) => {
    const count = applicantsByGroup.get(group.id) ?? 0;
    const message =
      count > 0
        ? `¿Eliminar ${group.name} y sus ${count} postulaciones?`
        : `¿Eliminar ${group.name}?`;
    if (window.confirm(message)) {
      actions.removeGroup(group.id);
    }
  };

  return (
    <div className="calc-data">
      <Panel
        title="Grupos"
        icon="group"
        className="editor-panel"
        aside={
          <span className="panel-note">
            {formatNumber(groups.length)}{' '}
            {groups.length === 1 ? 'Grupo' : 'Grupos'}
          </span>
        }
      >
        {groups.length === 0 ? (
          <EmptyState title="No hay Grupos registrados" icon="group">
            Agrega la dotación de cada Grupo o carga un conjunto de datos de
            ejemplo para revisar el funcionamiento.
          </EmptyState>
        ) : (
          <div className="table-scroll">
            <table className="data-table editor-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th className="num">NNJ</th>
                  <th className="num">Nivel Medio</th>
                  <th>Ratio</th>
                  <th>Regularidad</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <div className="editor-name">
                        <span
                          className="group-dot"
                          style={{ background: group.color }}
                        />
                        <input
                          className="table-input"
                          type="text"
                          aria-label={`Nombre del Grupo ${group.id}`}
                          value={group.name}
                          onChange={(event) =>
                            actions.updateGroup(group.id, {
                              name: event.target.value,
                            })
                          }
                          onBlur={(event) => {
                            const name = event.target.value.trim();
                            actions.updateGroup(group.id, {
                              name:
                                name ||
                                `Grupo ${String(group.id).padStart(2, '0')}`,
                            });
                          }}
                        />
                      </div>
                    </td>
                    <td className="num">
                      <InlineNumber
                        label={`NNJ de ${group.name}`}
                        value={group.nnj}
                        min={0}
                        max={999}
                        onChange={(value) =>
                          actions.updateGroup(group.id, { nnj: value })
                        }
                      />
                    </td>
                    <td className="num">
                      <InlineNumber
                        label={`Nivel Medio de ${group.name}`}
                        value={group.nivelMedio}
                        min={0}
                        max={999}
                        onChange={(value) =>
                          actions.updateGroup(group.id, {
                            nivelMedio: value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <span className="ratio-value">
                        {formatRatio(group.ratio)}
                      </span>
                    </td>
                    <td>
                      <div className="editor-regularity">
                        <ToggleSwitch
                          checked={group.regular}
                          onChange={(checked) =>
                            actions.updateGroup(group.id, { regular: checked })
                          }
                          label={`Cambiar regularidad de ${group.name}`}
                        />
                        <span
                          className={
                            group.regular ? 'text-good' : 'text-bad'
                          }
                        >
                          {group.regular ? 'Regular' : 'Irregular'}
                        </span>
                      </div>
                    </td>
                    <td className="row-action-cell">
                      <button
                        type="button"
                        className="icon-button icon-button-danger"
                        onClick={() => handleRemoveGroup(group)}
                        title={`Eliminar ${group.name}`}
                        aria-label={`Eliminar ${group.name}`}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="editor-foot">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={actions.addGroup}
          >
            <Icon name="plus" size={15} />
            Agregar Grupo
          </button>
          <span className="panel-note">
            El ratio se calcula como Nivel Medio / NNJ.
          </span>
        </div>
      </Panel>

      <Panel
        title="Postulaciones"
        icon="users"
        className="editor-panel"
        aside={
          <span className="panel-note">
            {formatNumber(applicants.length)}{' '}
            {applicants.length === 1 ? 'postulación' : 'postulaciones'}
          </span>
        }
      >
        {groups.length === 0 ? (
          <EmptyState title="Primero registra los Grupos" icon="users">
            Las postulaciones deben pertenecer a un Grupo. Agrega al menos uno
            en la tabla anterior.
          </EmptyState>
        ) : applicants.length === 0 ? (
          <EmptyState title="No hay postulaciones" icon="users">
            Agrega las personas que postulan a la beca con su cargo y percentil
            RSH.
          </EmptyState>
        ) : (
          <div className="table-scroll">
            <table className="data-table editor-table applicants-editor">
              <thead>
                <tr>
                  <th>Postulante</th>
                  <th>Grupo</th>
                  <th>Cargo</th>
                  <th className="num">RSH</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {applicants.map((applicant) => {
                  const group = groupMap.get(applicant.groupId);
                  return (
                    <tr
                      key={applicant.id}
                      className={group?.regular ? '' : 'is-excluded'}
                    >
                      <td>
                        <input
                          className="table-input"
                          type="text"
                          aria-label={`Nombre de ${applicant.id}`}
                          value={applicant.label}
                          onChange={(event) =>
                            actions.updateApplicant(applicant.id, {
                              label: event.target.value,
                            })
                          }
                          onBlur={(event) => {
                            const label = event.target.value.trim();
                            actions.updateApplicant(applicant.id, {
                              label: label || applicant.id,
                            });
                          }}
                        />
                      </td>
                      <td>
                        <select
                          className="table-input table-select"
                          aria-label={`Grupo de ${applicant.label}`}
                          value={applicant.groupId}
                          onChange={(event) =>
                            actions.updateApplicant(applicant.id, {
                              groupId: Number(event.target.value),
                            })
                          }
                        >
                          {groups.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="table-input table-select"
                          aria-label={`Cargo de ${applicant.label}`}
                          value={applicant.role}
                          onChange={(event) =>
                            actions.updateApplicant(applicant.id, {
                              role: event.target.value as Applicant['role'],
                            })
                          }
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_META[role].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="num">
                        <InlineNumber
                          label={`RSH de ${applicant.label}`}
                          value={applicant.rsh}
                          min={0}
                          max={100}
                          onChange={(value) =>
                            actions.updateApplicant(applicant.id, {
                              rsh: value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <span
                          className={`table-status ${
                            group?.regular ? '' : 'is-excluded'
                          }`}
                        >
                          {group?.regular ? 'Admisible' : 'Excluido'}
                        </span>
                      </td>
                      <td className="row-action-cell">
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar la postulación de ${applicant.label}?`,
                              )
                            ) {
                              actions.removeApplicant(applicant.id);
                            }
                          }}
                          title={`Eliminar ${applicant.label}`}
                          aria-label={`Eliminar ${applicant.label}`}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="editor-foot">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={actions.addApplicant}
            disabled={groups.length === 0}
          >
            <Icon name="plus" size={15} />
            Agregar postulación
          </button>
          <span className="panel-note">
            Las postulaciones de Grupos irregulares se excluyen del cálculo.
          </span>
        </div>
      </Panel>

      <InfoNote icon="info">
        Los datos se guardan únicamente en este navegador. Usa{' '}
        <strong>Exportar JSON</strong> para mantener un respaldo o trasladar el
        proceso a otro equipo.
      </InfoNote>
    </div>
  );
}
