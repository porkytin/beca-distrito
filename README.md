# Sistema de Becas de Formación

Aplicación de una sola página (SPA) para el Sistema de Becas de Formación de un
Distrito. Tiene dos modalidades:

- **Cálculo:** la Comisión de Becas registra la dotación de los Grupos, la nómina
  de postulaciones y los parámetros vigentes, y obtiene la asignación.
- **Simulación:** se genera un escenario reproducible y se recorre el mecanismo
  paso a paso para revisar cómo se aplican las reglas.

Todo corre **en el navegador**: no hay backend, no se envían datos y los
documentos se generan localmente. Los datos del modo de cálculo se guardan en
`localStorage` y se pueden respaldar o trasladar con un archivo JSON.

## Ejecutar

```bash
npm install
npm run dev
```

Abre el enlace que muestra Vite (por defecto `http://localhost:5173`).

Para generar la versión estática:

```bash
npm run build
npm run preview
```

El resultado queda en `dist/` y puede publicarse en cualquier hosting estático.

## Publicar en GitHub Pages

`vite.config.ts` usa `base: './'` y la navegación es por hash, así que el build
funciona sin cambios bajo una ruta de proyecto (`usuario.github.io/repo/`).

1. Sube el repositorio a GitHub (público; Pages en repos privados requiere plan
   de pago).
2. En **Settings → Pages → Source**, elige **GitHub Actions**.
3. Haz push a `main`: el flujo `.github/workflows/deploy.yml` compila y publica
   `dist/` automáticamente. También se puede lanzar a mano con **Run workflow**.
4. La app queda en `https://usuario.github.io/repo/`.

No requiere backend ni variables de entorno: todo se ejecuta en el navegador.

## Modo de cálculo

Es la modalidad para el trabajo de la Comisión con datos reales del proceso.

1. **Datos:** agrega los Grupos con su nombre, NNJ, Nivel Medio y regularidad; y
   las postulaciones con nombre, Grupo, cargo y percentil RSH. El ratio
   `Nivel Medio / NNJ` se calcula automáticamente.
2. **Parámetros:** define el fondo anual, el costo del Curso Medio, la tolerancia
   de empate RSH, la diferencia relativa máxima, el umbral de ratio y la curva.
3. **Resultado:** revisa el ranking, los empates técnicos, la asignación por
   persona y por Grupo, y descarga el informe en PDF o la nómina en CSV.

Los datos se guardan solo en el navegador. **Exportar JSON** permite conservar un
respaldo o continuar el proceso en otro equipo; **Importar JSON** recupera ese
respaldo. El botón **Borrar datos** elimina todo el contenido local.

El cálculo se actualiza a medida que se editan los datos o los parámetros. El PDF
del modo de cálculo indica que es un documento de trabajo y que la asignación
debe ser revisada y aplicada por la Comisión conforme al reglamento.

## Modo de simulación

| Sección | Qué muestra |
| --- | --- |
| Resumen | Semilla, dotación, parámetros y alcance del recorrido |
| Grupos | Generación de 10 Grupos y su dotación (NNJ y Nivel Medio) |
| Postulaciones | Postulantes, cargo, percentil RSH y distribución socioeconómica |
| Fondo | Presupuesto anual y costo del Curso Medio; caso A/B |
| Regularidad | Grupos regulares e irregulares; filtro de admisibilidad |
| Parámetros | Tolerancia RSH, diferencia máxima, curva y umbral de ratio |
| Baldes | Primer ordenamiento por vulnerabilidad socioeconómica |
| Ranking | Desempate por cargo, necesidad formativa y empate técnico |
| Asignación | Montos por puesto, brecha real y reparto por Grupo |
| Informe | Descarga del PDF con todo el escenario |

Se puede navegar con los botones, con las flechas del teclado o con las
secciones de la barra inferior. Cada modalidad tiene un hash propio:

- `#calculo/datos`, `#calculo/parametros`, `#calculo/resultado`
- `#simulacion/0` … `#simulacion/9`

El botón **Reglas** de la barra superior abre un resumen del reglamento:
admisibilidad, baldes, desempate, reparto, actores y la comparación entre los
parámetros vigentes y los ajustados en la modalidad actual.

## Aleatoriedad ajustable

La semilla hace que un escenario sea reproducible. Además se pueden ajustar:

- Rango de NNJ por Grupo.
- Rango de Guiadoras/Dirigentes con Nivel Medio.
- Cantidad de postulaciones por Grupo.
- Rango y concentración del percentil RSH.
- Peso relativo de cada cargo al postular.
- Probabilidad de Grupos irregulares y estado manual de cada Grupo.

Los datos de la simulación son ficticios: no se usan nombres ni antecedentes
reales.

## Mecanismo implementado

1. Solo los Grupos regulares aportan postulantes admisibles.
2. Los postulantes se ordenan por percentil RSH ascendente (menor = más
   vulnerable) y se agrupan en **baldes** de ancho igual a la tolerancia.
3. Dentro de cada balde se ordena por cargo, luego por el ratio
   `Nivel Medio / NNJ` del Grupo. Si la diferencia de ratios es menor al umbral,
   se declara **empate técnico**.
4. El fondo se reparte de forma decreciente según la curva elegida. La
   diferencia entre el primer y el último monto no supera el parámetro de
   diferencia relativa máxima. Nadie recibe más que el costo del curso.
5. Los empates técnicos suman sus montos preliminares y los dividen en partes
   iguales.

Las curvas disponibles son lineal, exponencial, logarítmica y acelerada.

## Reportes

El botón **Descargar PDF** genera un documento A4 con:

- Fecha y datos de origen (semilla en la simulación; datos de la Comisión en el
  cálculo).
- Resumen del fondo, la demanda y la cobertura.
- Gráfico de asignación por puesto.
- Ranking completo con montos.
- Dotación y resultado por Grupo.
- Nota metodológica.

En el modo de cálculo, **Exportar CSV** descarga la nómina del ranking con
puesto, postulante, Grupo, cargo, RSH, balde, ratio, empate y monto.

La generación del PDF se carga de forma diferida para no aumentar el tamaño
inicial de la aplicación.

## Estructura

```
src/
  domain/        Motor: generación, datos manuales, ranking, asignación y formato
  components/    Interfaz, secciones de simulación y espacio de cálculo
  report/        PDF con jsPDF y exportación CSV
  App.tsx        Estado global, modos y navegación por hash
  useCalculation.ts  Estado del cálculo y persistencia local
  styles.css     Diseño y reglas responsive
scripts/
  check.ts       Comprobaciones de propiedades del motor
  shots.mjs      Capturas de pantalla con un servidor de desarrollo activo
  checks.mjs     Pruebas de interacción, empates y PDF
```

## Comprobaciones

```bash
npm run check
```

El script recorre miles de combinaciones de semillas, parámetros, curvas y
presupuestos, y verifica que se respeten el tope del costo, el uso del fondo, el
orden decreciente y la igualdad de montos en empates técnicos. También valida la
normalización de datos manuales y que el ratio de cada postulación se derive de
la dotación vigente del Grupo.

## Stack

- Vite + React + TypeScript
- jsPDF + jspdf-autotable para el reporte
- CSS propio, sin dependencias de UI ni fuentes externas
