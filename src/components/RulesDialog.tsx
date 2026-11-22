import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import { DEFAULT_PARAMS } from '../domain/defaults';
import { formatDecimal, formatPercent } from '../domain/format';
import { CURVE_META, type SimulationParams } from '../domain/types';

const RULES: { title: string; body: ReactNode }[] = [
  {
    title: 'Quién puede postular',
    body: (
      <>
        Solo los <strong>Grupos en Situación Regular</strong>. Un Grupo queda
        irregular si un becario del proceso de hace dos años (N−2) no aprobó su
        tutoría; se regulariza reintegrando los fondos antes de postular. La
        postulación es una ventana única anual: sin cupo zonal, la beca se
        mantiene para otra Zona y caduca al cierre del año.
      </>
    ),
  },
  {
    title: 'Baldes por situación socioeconómica',
    body: (
      <>
        Los postulantes admisibles se ordenan por <strong>percentil RSH</strong>{' '}
        ascendente (menor percentil, mayor vulnerabilidad) y se agrupan en
        baldes del ancho de la tolerancia. Quienes caen en el mismo balde se
        consideran empatados en RSH.
      </>
    ),
  },
  {
    title: 'Desempate por rol e impacto en el Grupo',
    body: (
      <>
        Dentro de cada balde: <strong>Responsable de Grupo</strong>, Asistente
        de Grupo, Responsable de Unidad y otros cargos. A igual cargo, gana el
        Grupo con menor <strong>ratio Nivel Medio / NNJ</strong>. Si la
        diferencia de ratios es menor al umbral, se declara un{' '}
        <strong>empate técnico</strong>.
      </>
    ),
  },
  {
    title: 'Reparto del fondo',
    body: (
      <>
        Si el fondo alcanza, cada persona recibe el <strong>100%</strong> del
        costo del Curso Medio. Si no, se reparte en forma decreciente según la
        curva, sin superar el costo del curso ni la diferencia relativa máxima.
        Los empates técnicos suman sus montos y los dividen en partes iguales.
      </>
    ),
  },
];

const ACTORS = [
  {
    name: 'Comisión de Becas',
    role: 'Propone los parámetros y aplica el mecanismo.',
  },
  {
    name: 'Asamblea de Distrito',
    role: 'Aprueba el presupuesto y ratifica los parámetros.',
  },
  {
    name: 'Equipo Distrital',
    role: 'Tesorería y CVD administran datos, pagos y registro histórico.',
  },
];

interface RulesDialogProps {
  open: boolean;
  onClose: () => void;
  params: SimulationParams;
  mode: 'simulation' | 'calculation' | 'start';
}

export function RulesDialog({
  open,
  onClose,
  params,
  mode,
}: RulesDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const rows = [
    {
      label: 'Tolerancia de empate RSH',
      rule: '2 pp',
      current: `${formatDecimal(params.tolerance, 1)} pp`,
      changed: params.tolerance !== DEFAULT_PARAMS.tolerance,
    },
    {
      label: 'Diferencia relativa máxima',
      rule: '100%',
      current: formatPercent(params.maxDiff, 0),
      changed: params.maxDiff !== DEFAULT_PARAMS.maxDiff,
    },
    {
      label: 'Curva de asignación',
      rule: 'Lineal',
      current: CURVE_META[params.curve].label,
      changed: params.curve !== DEFAULT_PARAMS.curve,
    },
    {
      label: 'Umbral de ratio NM / NNJ',
      rule: '0,05',
      current: formatDecimal(params.minRatioDiff, 3),
      changed: params.minRatioDiff !== DEFAULT_PARAMS.minRatioDiff,
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      className="rules-dialog"
      aria-labelledby="rules-title"
      aria-describedby="rules-lede"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onClose={onClose}
    >
      <header className="rules-head">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Reglamento · Distrito
          </div>
          <h2 id="rules-title">Las reglas del sistema</h2>
          <p id="rules-lede">
            Resumen del Reglamento del Sistema de Becas de Formación. El
            mecanismo se aplica sobre los datos ingresados en el modo de cálculo
            o sobre los datos generados en la simulación.
          </p>
        </div>
        <button
          type="button"
          className="icon-button rules-close"
          onClick={onClose}
          title="Cerrar reglas"
          aria-label="Cerrar reglas"
        >
          <Icon name="x" size={18} />
        </button>
      </header>

      <div className="rules-body">
        <div className="rules-grid">
          {RULES.map((rule, index) => (
            <section className="rules-step" key={rule.title}>
              <span className="rules-step-index">{index + 1}</span>
              <div>
                <h3>{rule.title}</h3>
                <p>{rule.body}</p>
              </div>
            </section>
          ))}
        </div>

        <section className="rules-actors" aria-label="Quién hace qué">
          <h3 className="rules-subtitle">
            <Icon name="users" size={14} />
            Quién hace qué
          </h3>
          <div className="rules-actors-grid">
            {ACTORS.map((actor) => (
              <div key={actor.name}>
                <strong>{actor.name}</strong>
                <span>{actor.role}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rules-params" aria-label="Parámetros del modelo">
          <h3 className="rules-subtitle">
            <Icon name="sliders" size={14} />
            Parámetros del modelo
          </h3>
          <div className="rules-table-wrap">
            <table className="rules-table">
              <thead>
                <tr>
                  <th scope="col">Parámetro</th>
                  <th scope="col">Reglamento</th>
                  <th scope="col">Valor actual</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.rule}</td>
                    <td>
                      <span
                        className={`rules-now ${row.changed ? 'is-custom' : ''}`}
                        title={
                          row.changed
                            ? 'Ajustado en el modo actual'
                            : 'Valor propuesto por la Comisión'
                        }
                      >
                        {row.current}
                        {row.changed && (
                          <span className="rules-flag">ajustado</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rules-caption">
            Los valores del reglamento son la propuesta vigente de la Comisión
            de Becas. Cualquier cambio lo propone ella y lo ratifica la Asamblea
            antes de aplicarse.
          </p>
        </section>
      </div>

      <footer className="rules-foot">
        <span className="rules-foot-note">
          {mode === 'calculation'
            ? 'Datos guardados en este navegador · Procesamiento local'
            : mode === 'simulation'
              ? 'Datos ficticios · Procesamiento local'
              : 'Procesamiento local · Sin envío de datos'}
        </span>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Cerrar
          <Icon name="check" size={16} />
        </button>
      </footer>
    </dialog>
  );
}
