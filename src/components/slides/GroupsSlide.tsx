import { Icon } from '../Icon';
import {
  InfoNote,
  NumberField,
  Panel,
  RangeField,
  RangePair,
  SlideHeading,
  Stat,
  StatusPill,
} from '../ui';
import { useAnimatedNumber } from '../../hooks';
import { formatNumber, formatPercent, formatRatio } from '../../domain/format';
import type { Applicant, Group, RandomConfig } from '../../domain/types';

interface GroupsSlideProps {
  random: RandomConfig;
  updateRandom: (patch: Partial<RandomConfig>) => void;
  regenerate: () => void;
  groups: Group[];
  applicants: Applicant[];
}

export function GroupsSlide({
  random,
  updateRandom,
  regenerate,
  groups,
  applicants,
}: GroupsSlideProps) {
  const totalNnj = useAnimatedNumber(
    groups.reduce((sum, group) => sum + group.nnj, 0),
  );
  const totalNivelMedio = useAnimatedNumber(
    groups.reduce((sum, group) => sum + group.nivelMedio, 0),
  );
  const districtRatio =
    groups.reduce((sum, group) => sum + group.nnj, 0) > 0
      ? groups.reduce((sum, group) => sum + group.nivelMedio, 0) /
        groups.reduce((sum, group) => sum + group.nnj, 0)
      : 0;
  const maxRatio = Math.max(...groups.map((group) => group.ratio), 0.001);

  const countByGroup = new Map<number, number>();
  for (const applicant of applicants) {
    countByGroup.set(
      applicant.groupId,
      (countByGroup.get(applicant.groupId) ?? 0) + 1,
    );
  }

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Paso 0 · Datos del distrito"
        title="Los 10 grupos del distrito"
        lede="El CVD consolida la dotación de cada Grupo: Niños, Niñas y Jóvenes (NNJ) y Guiadoras o Dirigentes con Nivel Medio. Ajusta la aleatoriedad para crear escenarios distintos."
      />

      <div className="data-layout">
        <aside className="data-sidebar">
          <Panel
            title="Aleatoriedad"
            icon="shuffle"
            aside={<span className="panel-badge">Reproducible</span>}
          >
            <div className="seed-control">
              <NumberField
                label="Semilla del escenario"
                value={random.seed}
                min={0}
                max={999999}
                onChange={(value) => updateRandom({ seed: value })}
                hint="La misma semilla siempre genera los mismos datos."
              />
              <button
                type="button"
                className="btn btn-secondary seed-button"
                onClick={regenerate}
              >
                <Icon name="refresh" size={16} />
                Regenerar
              </button>
            </div>

            <div className="control-stack">
              <RangePair label="Niños, Niñas y Jóvenes por Grupo">
                <NumberField
                  compact
                  label="Mín."
                  value={random.nnjMin}
                  min={1}
                  max={200}
                  onChange={(value) => updateRandom({ nnjMin: value })}
                />
                <NumberField
                  compact
                  label="Máx."
                  value={random.nnjMax}
                  min={1}
                  max={200}
                  onChange={(value) => updateRandom({ nnjMax: value })}
                />
              </RangePair>

              <RangePair label="Guiadoras/Dirigentes con Nivel Medio">
                <NumberField
                  compact
                  label="Mín."
                  value={random.nivelMedioMin}
                  min={0}
                  max={60}
                  onChange={(value) => updateRandom({ nivelMedioMin: value })}
                />
                <NumberField
                  compact
                  label="Máx."
                  value={random.nivelMedioMax}
                  min={0}
                  max={60}
                  onChange={(value) => updateRandom({ nivelMedioMax: value })}
                />
              </RangePair>

              <RangePair label="Postulaciones por Grupo">
                <NumberField
                  compact
                  label="Mín."
                  value={random.applicantsMin}
                  min={0}
                  max={4}
                  onChange={(value) => updateRandom({ applicantsMin: value })}
                />
                <NumberField
                  compact
                  label="Máx."
                  value={random.applicantsMax}
                  min={0}
                  max={4}
                  onChange={(value) => updateRandom({ applicantsMax: value })}
                />
              </RangePair>

              <RangeField
                label="Grupos en situación irregular"
                value={random.irregularChance}
                min={0}
                max={100}
                step={5}
                onChange={(value) => updateRandom({ irregularChance: value })}
                format={(value) => `${formatPercent(value)} de probabilidad`}
                hint="Se puede ajustar Grupo por Grupo en el Paso 2."
                accent="var(--rose)"
              />
            </div>
          </Panel>

          <InfoNote icon="info">
            Los datos son ficticios y se generan localmente. La semilla permite
            repetir exactamente el mismo escenario en otro momento.
          </InfoNote>
        </aside>

        <div className="data-main">
          <div className="stat-strip">
            <Stat
              label="Total NNJ"
              value={formatNumber(totalNnj)}
              icon="users"
              hint="En los 10 grupos"
            />
            <Stat
              label="Total Nivel Medio"
              value={formatNumber(totalNivelMedio)}
              icon="target"
              hint="Guiadoras y Dirigentes formados"
            />
            <Stat
              label="Ratio distrital"
              value={formatRatio(districtRatio)}
              icon="scale"
              hint="Nivel Medio por NNJ"
              accent="var(--teal)"
            />
            <Stat
              label="Postulaciones"
              value={formatNumber(applicants.length)}
              icon="file"
              hint={`${formatNumber(groups.length)} grupos`}
              accent="var(--violet)"
            />
          </div>

          <Panel
            title="Dotación y necesidad formativa"
            icon="group"
            className="table-panel"
            aside={
              <span className="panel-note">
                Menor ratio = mayor déficit relativo
              </span>
            }
          >
            <div className="table-scroll">
              <table className="data-table groups-table">
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th className="num">NNJ</th>
                    <th className="num">Nivel Medio</th>
                    <th>Ratio NM / NNJ</th>
                    <th className="num">Postulaciones</th>
                    <th>Regularidad</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id}>
                      <td>
                        <span className="group-name">
                          <span
                            className="group-dot"
                            style={{ background: group.color }}
                          />
                          {group.name}
                        </span>
                      </td>
                      <td className="num">{formatNumber(group.nnj)}</td>
                      <td className="num">{formatNumber(group.nivelMedio)}</td>
                      <td>
                        <div className="ratio-cell">
                          <div className="ratio-track">
                            <span
                              style={{
                                width: `${Math.min(
                                  100,
                                  (group.ratio / maxRatio) * 100,
                                )}%`,
                                background: group.color,
                              }}
                            />
                          </div>
                          <span className="ratio-value">
                            {formatRatio(group.ratio)}
                          </span>
                        </div>
                      </td>
                      <td className="num">
                        {formatNumber(countByGroup.get(group.id) ?? 0)}
                      </td>
                      <td>
                        <StatusPill regular={group.regular} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
