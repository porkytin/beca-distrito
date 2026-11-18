import { Icon } from '../Icon';
import { EmptyState, InfoNote, SlideHeading, Stat } from '../ui';
import { formatDecimal, formatNumber } from '../../domain/format';
import { ROLE_META, type Group } from '../../domain/types';
import type { SimulationView } from '../../domain/simulation';

interface BucketsSlideProps {
  simulation: SimulationView;
  groups: Group[];
  tolerance: number;
}

export function BucketsSlide({
  simulation,
  groups,
  tolerance,
}: BucketsSlideProps) {
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const averageSize =
    simulation.buckets.length > 0
      ? simulation.admissible.length / simulation.buckets.length
      : 0;
  const largest = Math.max(
    0,
    ...simulation.buckets.map((bucket) => bucket.members.length),
  );

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Paso 3.2 · Primer ordenamiento"
        title="Baldes de vulnerabilidad socioeconómica"
        lede="El ranking parte por el percentil RSH. Se forma un primer balde desde el postulante más vulnerable y se incorporan todos quienes estén dentro del ancho de tolerancia. Luego se abre el siguiente balde con el postulante que quedó fuera."
      />

      <div className="stat-strip">
        <Stat
          label="Baldes formados"
          value={formatNumber(simulation.buckets.length)}
          icon="layers"
          hint={`Tolerancia de ${formatDecimal(tolerance, 1)} pp`}
          accent="var(--violet)"
        />
        <Stat
          label="Postulantes admitidos"
          value={formatNumber(simulation.admissible.length)}
          icon="users"
          hint="Ordenados por vulnerabilidad"
        />
        <Stat
          label="Tamaño promedio"
          value={formatDecimal(averageSize, 1)}
          icon="scale"
          hint="Postulantes por balde"
        />
        <Stat
          label="Balde más grande"
          value={formatNumber(largest)}
          icon="group"
          hint="Personas empatadas en RSH"
          accent="var(--amber)"
        />
      </div>

      <InfoNote icon="info" tone="violet">
        Dentro de un balde todos se consideran inicialmente empatados en su
        situación socioeconómica. El orden definitivo se resuelve en el
        siguiente paso: primero el cargo, luego la necesidad formativa del
        Grupo.
      </InfoNote>

      {simulation.buckets.length === 0 ? (
        <div className="card buckets-empty">
          <EmptyState title="No hay baldes para mostrar" icon="layers">
            Todos los Grupos están irregulares o no hay postulaciones. Vuelve al
            Paso 2 o genera nuevos datos.
          </EmptyState>
        </div>
      ) : (
        <div className="bucket-list">
          {simulation.buckets.map((bucket, index) => (
            <div
              key={bucket.index}
              className="bucket-row card"
              style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
            >
              <div className="bucket-label">
                <span className="bucket-index">
                  {String(bucket.index).padStart(2, '0')}
                </span>
                <div>
                  <strong>Balde {bucket.index}</strong>
                  <span>
                    RSH {bucket.start}
                    {bucket.end !== bucket.start ? ` – ${bucket.end}` : ''}
                  </span>
                </div>
              </div>

              <div className="bucket-members">
                {[...bucket.members]
                  .sort(
                    (a, b) =>
                      a.applicant.rsh - b.applicant.rsh ||
                      a.applicant.id.localeCompare(b.applicant.id),
                  )
                  .map((member) => {
                    const meta = ROLE_META[member.applicant.role];
                    const group = groupMap.get(member.applicant.groupId);
                    return (
                      <span
                        key={member.applicant.id}
                        className="bucket-chip"
                        style={{ borderLeftColor: meta.color }}
                        title={`${meta.label} · ${group?.name} · Ratio ${group?.ratio.toFixed(3)}`}
                      >
                        <span className="bucket-chip-id">
                          {member.applicant.id}
                        </span>
                        <span className="bucket-chip-meta">
                          {group?.name}
                          <small>
                            {meta.short} · RSH {member.applicant.rsh}
                          </small>
                        </span>
                      </span>
                    );
                  })}
              </div>

              <div className="bucket-side">
                <span className="bucket-count">
                  {bucket.members.length}
                  <small>{bucket.members.length === 1 ? 'persona' : 'personas'}</small>
                </span>
                {bucket.hasTie && (
                  <span className="tie-mini">
                    <Icon name="equal" size={12} />
                    con empate
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bucket-footer card">
        <div className="bucket-footer-icon">
          <Icon name="scale" size={22} />
        </div>
        <div>
          <strong>El ancho del balde es un parámetro, no una regla fija.</strong>
          <p>
            Con una tolerancia de {formatDecimal(tolerance, 1)} puntos
            porcentuales, los percentiles que caen dentro del mismo tramo
            compiten entre sí por el desempate por cargo. Si reduces la
            tolerancia a 0, solo los RSH idénticos comparten balde.
          </p>
        </div>
      </div>
    </div>
  );
}
