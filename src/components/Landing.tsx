import { Icon } from './Icon';

export function Landing({
  onCalculation,
  onSimulation,
  onShowRules,
}: {
  onCalculation: () => void;
  onSimulation: () => void;
  onShowRules: () => void;
}) {
  return (
    <div className="landing">
      <header className="landing-head">
        <span className="eyebrow">Distrito · Comisión de Becas</span>
        <h1>Sistema de Becas de Formación</h1>
        <p>
          Cálculo de asignación con datos ingresados por la Comisión y
          simulación del mecanismo con datos generados. Ambas modalidades
          procesan la información en este navegador.
        </p>
      </header>

      <div className="mode-grid">
        <section className="mode-card">
          <span className="mode-icon">
            <Icon name="calculator" size={22} />
          </span>
          <span className="mode-kicker">Modo de cálculo</span>
          <h2>Asignación con datos del proceso</h2>
          <p>
            Registra la dotación de los Grupos, las postulaciones y los
            parámetros vigentes. El resultado se actualiza a medida que editas
            los datos.
          </p>
          <ul className="mode-list">
            <li>Datos guardados en este navegador</li>
            <li>Respaldo en JSON</li>
            <li>Informe PDF y nómina en CSV</li>
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onCalculation}
          >
            Abrir cálculo
            <Icon name="arrowRight" size={17} />
          </button>
        </section>

        <section className="mode-card">
          <span className="mode-icon mode-icon-neutral">
            <Icon name="layers" size={22} />
          </span>
          <span className="mode-kicker">Modo de simulación</span>
          <h2>Recorrido del mecanismo</h2>
          <p>
            Revisa paso a paso cómo se generan los datos, se ordenan las
            postulaciones y se reparte el fondo. La semilla permite repetir un
            escenario.
          </p>
          <ul className="mode-list">
            <li>Datos generados, sin información real</li>
            <li>Parámetros y semilla ajustables</li>
            <li>Informe PDF del escenario</li>
          </ul>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onSimulation}
          >
            Abrir simulación
            <Icon name="arrowRight" size={17} />
          </button>
        </section>
      </div>

      <footer className="landing-foot">
        <button type="button" className="btn btn-quiet" onClick={onShowRules}>
          <Icon name="scale" size={16} />
          Reglas del sistema
        </button>
        <span>
          Sin servidor ni envío de datos. El procesamiento ocurre en el
          navegador.
        </span>
      </footer>
    </div>
  );
}
