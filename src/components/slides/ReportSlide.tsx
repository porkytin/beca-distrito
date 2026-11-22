import { useState } from 'react';
import { Icon } from '../Icon';
import { InfoNote, SlideHeading, TypePill } from '../ui';
import {
  formatCLP,
  formatLongDate,
  formatNumber,
  formatPercent,
} from '../../domain/format';
import { CURVE_META, ROLE_META } from '../../domain/types';
import type { SimulationView } from '../../domain/simulation';
import type { RandomConfig, SimulationParams } from '../../domain/types';

interface ReportSlideProps {
  simulation: SimulationView;
  params: SimulationParams;
  random: RandomConfig;
  generatedAt: Date;
  onDownload: () => Promise<void> | void;
  onReset: () => void;
}

const included = [
  'Portada con fecha, semilla y parámetros',
  'Resumen del fondo y la cobertura',
  'Ranking completo con montos asignados',
  'Dotación y resultado por cada Grupo',
  'Nota metodológica del mecanismo',
];

export function ReportSlide({
  simulation,
  params,
  random,
  generatedAt,
  onDownload,
  onReset,
}: ReportSlideProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { allocation, ranked } = simulation;
  const top = ranked.slice(0, 5);
  const noDemand = ranked.length === 0;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await onDownload();
    } catch {
      setError('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      window.setTimeout(() => setDownloading(false), 500);
    }
  };

  return (
    <div className="slide-inner">
      <SlideHeading
        eyebrow="Cierre · Reporte"
        title="Informe de la simulación"
        lede="El reporte reúne el escenario generado, los parámetros ratificados, el ranking completo y la asignación por persona y por Grupo. Se descarga como PDF directamente desde tu navegador."
        meta={
          <TypePill tone={noDemand ? 'rose' : 'green'}>
            <Icon name={noDemand ? 'info' : 'check'} size={14} />
            {noDemand ? 'Sin demanda admisible' : 'Simulación completa'}
          </TypePill>
        }
      />

      <div className="report-layout">
        <div className="report-preview-wrap">
          <div className="report-preview card">
            <div className="report-preview-head">
              <div>
                <span className="mini-label">Distrito · Comisión de Becas</span>
                <strong>Reporte de simulación</strong>
              </div>
              <span className="report-preview-date">
                {formatLongDate(generatedAt)}
              </span>
            </div>

            <div className="report-preview-metrics">
              <div>
                <span>Fondo</span>
                <strong>{formatCLP(params.budget)}</strong>
              </div>
              <div>
                <span>Asignado</span>
                <strong>{formatCLP(allocation.totalAssigned)}</strong>
              </div>
              <div>
                <span>Postulantes</span>
                <strong>{formatNumber(ranked.length)}</strong>
              </div>
            </div>

            <div className="report-preview-table">
              <div className="report-preview-tr report-preview-th">
                <span>#</span>
                <span>Postulante</span>
                <span>Grupo</span>
                <span>Cargo</span>
                <span>Monto</span>
              </div>
              {top.length === 0 ? (
                <div className="report-preview-empty">
                  Sin postulantes admisibles en este escenario.
                </div>
              ) : (
                top.map((member, index) => (
                  <div className="report-preview-tr" key={member.applicant.id}>
                    <span>{member.position}</span>
                    <span>{member.applicant.label}</span>
                    <span>
                      {simulation.groups.find(
                        (group) => group.id === member.applicant.groupId,
                      )?.name ?? '—'}
                    </span>
                    <span>{ROLE_META[member.applicant.role].short}</span>
                    <span>{formatCLP(allocation.amounts[index] ?? 0)}</span>
                  </div>
                ))
              )}
              {ranked.length > 5 && (
                <div className="report-preview-more">
                  + {ranked.length - 5} postulantes en el documento completo
                </div>
              )}
            </div>

            <div className="report-preview-footer">
              <span>Escenario N° {random.seed}</span>
              <span>
                Cobertura{' '}
                {formatPercent(
                  Math.min(100, allocation.coverage * 100),
                  0,
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="report-actions">
          <div className="download-card card">
            <div className="download-icon">
              <Icon name="file" size={28} />
            </div>
            <h3>Descargar reporte PDF</h3>
            <p>
              Documento de trabajo para la Asamblea o el Equipo Distrital. No
              se envía información a ningún servidor.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className="spinner" />
                  Generando PDF…
                </>
              ) : (
                <>
                  <Icon name="download" size={19} />
                  Descargar PDF
                </>
              )}
            </button>

            {error && <p className="download-error">{error}</p>}

            <ul className="included-list">
              {included.map((item) => (
                <li key={item}>
                  <Icon name="check" size={14} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="download-meta">
              <span>
                Semilla <b>{random.seed}</b>
              </span>
              <span>
                Curva <b>{CURVE_META[params.curve].label}</b>
              </span>
              <span>
                Baldes <b>{formatNumber(simulation.buckets.length)}</b>
              </span>
            </div>
          </div>

          <button type="button" className="btn btn-secondary btn-block" onClick={onReset}>
            <Icon name="refresh" size={17} />
            Nueva simulación
          </button>

          <InfoNote icon="info">
            Los nombres, Grupos y montos son ficticios. El PDF se genera en tu
            navegador y no se envía a ningún servidor.
          </InfoNote>
        </div>
      </div>
    </div>
  );
}
