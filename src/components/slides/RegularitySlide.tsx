import { Icon } from '../Icon';
import {
  InfoNote,
  SlideHeading,
  Stat,
  StatusPill,
  ToggleSwitch,
} from '../ui';
import { formatNumber, formatRatio } from '../../domain/format';
import { ROLE_META, type Applicant, type Group } from '../../domain/types';

interface RegularitySlideProps {
  groups: Group[];
  applicants: Applicant[];
  admissible: Applicant[];
  excluded: Applicant[];
  onToggleGroup: (groupId: number, regular: boolean) => void;
  onAllRegular: () => void;
}

export function RegularitySlide({
  groups,
  applicants,
  admissible,
  excluded,
  onToggleGroup,
  onAllRegular,
}: RegularitySlideProps) {
  const byGroup = new Map<number, Applicant[]>();
  for (const applicant of applicants) {
    const list = byGroup.get(applicant.groupId) ?? [];
    list.push(applicant);
    byGroup.set(applicant.groupId, list);
  }

  const irregularGroups = groups.filter((group) => !group.regular).length;

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Simulación · Condición de regularidad"
        title="Solo los Grupos regulares pueden postular"
        lede="Un Grupo queda en situación irregular si mantiene beneficiarios del proceso de hace dos años (N-2) sin su tutoría aprobada por el Verificador. Aquí puedes cambiar el estado de cada Grupo y ver el efecto inmediato en la nómina."
        meta={
          <button
            type="button"
            className="btn btn-quiet"
            onClick={onAllRegular}
            disabled={irregularGroups === 0}
          >
            <Icon name="check" size={16} />
            Marcar todos como regulares
          </button>
        }
      />

      <div className="stat-strip regularity-stats">
        <Stat
          label="Grupos regulares"
          value={`${formatNumber(groups.length - irregularGroups)} / ${groups.length}`}
          icon="group"
          hint="Habilitados para postular"
          accent="var(--green)"
        />
        <Stat
          label="Grupos irregulares"
          value={formatNumber(irregularGroups)}
          icon="info"
          hint="Con tutorías atrasadas"
          accent={irregularGroups > 0 ? 'var(--rose)' : undefined}
        />
        <Stat
          label="Postulantes admisibles"
          value={formatNumber(admissible.length)}
          icon="users"
          hint="Pasan al mecanismo de asignación"
          accent="var(--accent)"
        />
        <Stat
          label="Postulantes excluidos"
          value={formatNumber(excluded.length)}
          icon="x"
          hint="Pertenecen a Grupos irregulares"
          accent={excluded.length > 0 ? 'var(--rose)' : undefined}
        />
      </div>

      <div className="regularity-toolbar">
        <InfoNote icon="info" tone="amber">
          Regla del sistema: si un Grupo regulariza su situación mediante
          reintegro antes de la postulación, vuelve a quedar habilitado. Aquí el
          estado se edita directamente para explorar escenarios.
        </InfoNote>
        <div className="regularity-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'var(--green)' }} />
            Regular
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'var(--rose)' }} />
            Irregular
          </span>
        </div>
      </div>

      <div className="group-state-grid">
        {groups.map((group) => {
          const groupApplicants = byGroup.get(group.id) ?? [];
          return (
            <article
              key={group.id}
              className={`group-state-card card ${
                group.regular ? 'is-regular' : 'is-irregular'
              }`}
            >
              <div className="group-state-head">
                <div>
                  <span className="group-name">
                    <span
                      className="group-dot"
                      style={{ background: group.color }}
                    />
                    {group.name}
                  </span>
                  <span className="group-state-ratio">
                    {formatRatio(group.ratio)} NM / NNJ
                  </span>
                </div>
                <ToggleSwitch
                  checked={group.regular}
                  onChange={(checked) => onToggleGroup(group.id, checked)}
                  label={`Cambiar regularidad de ${group.name}`}
                />
              </div>

              <div className="group-state-meta">
                <span>{formatNumber(group.nnj)} NNJ</span>
                <span>{formatNumber(group.nivelMedio)} Nivel Medio</span>
              </div>

              <div
                className={`group-applicants ${
                  group.regular ? '' : 'are-excluded'
                }`}
              >
                {groupApplicants.length === 0 ? (
                  <span className="muted-note">Sin postulaciones</span>
                ) : (
                  groupApplicants.map((applicant) => {
                    const meta = ROLE_META[applicant.role];
                    return (
                      <span
                        key={applicant.id}
                        className="applicant-chip"
                        title={`${meta.label} · RSH ${applicant.rsh}`}
                        style={{ borderColor: `${meta.color}55` }}
                      >
                        <span
                          className="chip-dot"
                          style={{ background: meta.color }}
                        />
                        {applicant.id}
                        <small>{meta.short}</small>
                      </span>
                    );
                  })
                )}
              </div>

              <div className="group-state-foot">
                <StatusPill regular={group.regular} />
                <span
                  className={`group-state-note ${
                    group.regular ? 'is-good' : 'is-bad'
                  }`}
                >
                  {group.regular
                    ? `${groupApplicants.length} en carrera`
                    : `${groupApplicants.length} ${
                        groupApplicants.length === 1 ? 'excluido' : 'excluidos'
                      }`}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
