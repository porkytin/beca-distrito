import { useRef, useState } from 'react';
import { Icon } from '../Icon';
import { CalcData } from './CalcData';
import { CalcParams } from './CalcParams';
import { CalcResults } from './CalcResults';
import { downloadRankingCsv } from '../../report/csv';
import {
  formatCLP,
  formatNumber,
  formatPercent,
} from '../../domain/format';
import type { CalculationData } from '../../domain/manual';
import type { SimulationView } from '../../domain/simulation';
import type { CalculationActions } from '../../useCalculation';

export type CalcTab = 'datos' | 'parametros' | 'resultado';

interface CalcWorkspaceProps {
  calculation: CalculationData;
  simulation: SimulationView;
  savedAt: Date | null;
  actions: CalculationActions;
  tab: CalcTab;
  onTabChange: (tab: CalcTab) => void;
}

const TABS: { id: CalcTab; label: string }[] = [
  { id: 'datos', label: 'Datos' },
  { id: 'parametros', label: 'Parámetros' },
  { id: 'resultado', label: 'Resultado' },
];

export function CalcWorkspace({
  calculation,
  simulation,
  savedAt,
  actions,
  tab,
  onTabChange,
}: CalcWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { groups, applicants, params } = calculation;
  const regularGroups = groups.filter((group) => group.regular).length;
  const coverage =
    simulation.allocation.totalRequested > 0
      ? Math.min(100, simulation.allocation.coverage * 100)
      : 0;

  const handleLoadSample = () => {
    if (
      (groups.length > 0 || applicants.length > 0) &&
      !window.confirm(
        'Cargar los datos de ejemplo reemplaza los datos actuales. ¿Continuar?',
      )
    ) {
      return;
    }
    actions.loadSample();
  };

  const handleClear = () => {
    if (
      window.confirm(
        'Se eliminarán los Grupos, las postulaciones y los parámetros ingresados. ¿Continuar?',
      )
    ) {
      actions.clearAll();
    }
  };

  const handleImport = async (file: File) => {
    if (
      (groups.length > 0 || applicants.length > 0) &&
      !window.confirm(
        'Importar el respaldo reemplaza los datos actuales. ¿Continuar?',
      )
    ) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImportError(null);
    const result = await actions.importBackup(file);
    if (!result.ok) {
      setImportError(result.error);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const { downloadReport } = await import('../../report/pdf');
      downloadReport({
        simulation,
        params,
        mode: 'calculation',
        generatedAt: new Date(),
      });
    } catch {
      setDownloadError('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      window.setTimeout(() => setDownloading(false), 400);
    }
  };

  return (
    <div className="workspace">
      <header className="workspace-head">
        <div>
          <span className="eyebrow">Distrito · Comisión de Becas</span>
          <h1>Cálculo de asignación</h1>
          <p>
            Registra la dotación de los Grupos, la nómina de postulaciones y los
            parámetros del mecanismo para obtener la asignación.
          </p>
        </div>
        <span className="save-status" title="Los datos se guardan en este navegador">
          <Icon name="check" size={14} />
          {savedAt
            ? `Guardado local · ${savedAt.toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Almacenamiento local no disponible'}
        </span>
      </header>

      <nav className="workspace-tabs" role="tablist" aria-label="Secciones del cálculo">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`workspace-tab ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            {item.label}
            {item.id === 'datos' && (
              <span className="tab-count">
                {formatNumber(groups.length)} / {formatNumber(applicants.length)}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="calc-summary" aria-label="Resumen del cálculo">
        <div>
          <span>Grupos regulares</span>
          <strong>
            {formatNumber(regularGroups)} / {formatNumber(groups.length)}
          </strong>
        </div>
        <div>
          <span>Postulaciones</span>
          <strong>{formatNumber(applicants.length)}</strong>
        </div>
        <div>
          <span>Admisibles</span>
          <strong>{formatNumber(simulation.admissible.length)}</strong>
        </div>
        <div>
          <span>Fondo</span>
          <strong>{formatCLP(params.budget)}</strong>
        </div>
        <div>
          <span>Asignado</span>
          <strong>{formatCLP(simulation.allocation.totalAssigned)}</strong>
        </div>
        <div>
          <span>Cobertura</span>
          <strong>
            {simulation.allocation.totalRequested > 0
              ? formatPercent(coverage, 0)
              : '—'}
          </strong>
        </div>
      </div>

      {tab === 'datos' && (
        <>
          <div className="calc-toolbar">
            <div className="calc-toolbar-group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadSample}
              >
                Cargar datos de ejemplo
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name="upload" size={15} />
                Importar JSON
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={actions.exportBackup}
              >
                <Icon name="download" size={15} />
                Exportar JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleImport(file);
                }}
              />
            </div>
            <button
              type="button"
              className="btn btn-quiet btn-danger-text"
              onClick={handleClear}
            >
              <Icon name="trash" size={15} />
              Borrar datos
            </button>
          </div>

          {importError && <p className="download-error">{importError}</p>}

          <CalcData
            groups={groups}
            applicants={applicants}
            actions={actions}
          />
        </>
      )}

      {tab === 'parametros' && (
        <CalcParams
          params={params}
          updateParams={actions.updateParams}
          simulation={simulation}
        />
      )}

      {tab === 'resultado' && (
        <CalcResults
          simulation={simulation}
          params={params}
          downloading={downloading}
          downloadError={downloadError}
          onDownload={() => void handleDownload()}
          onExportCsv={() => downloadRankingCsv(simulation)}
        />
      )}
    </div>
  );
}
