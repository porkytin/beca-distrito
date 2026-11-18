# Simulador del Sistema de Becas de Formación

Aplicación de una sola página (SPA) que simula, paso a paso, el mecanismo de
asignación del fondo de becas de un Distrito. Corre **100% en el navegador**:
no hay backend, no se envían datos y el reporte PDF se genera localmente.

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

## El recorrido

| Sección | Qué muestra |
| --- | --- |
| Inicio | Portada del simulador |
| Grupos | Generación de 10 Grupos y su dotación (NNJ y Nivel Medio) |
| Postulaciones | Postulantes, cargo, percentil RSH y distribución socioeconómica |
| Fondo | Presupuesto anual y costo del Curso Medio; caso A/B |
| Regularidad | Grupos regulares e irregulares; filtro de admisibilidad |
| Parámetros | Tolerancia RSH, diferencia máxima, curva y umbral de ratio |
| Baldes | Primer ordenamiento por vulnerabilidad socioeconómica |
| Ranking | Desempate por cargo, necesidad formativa y empate técnico |
| Asignación | Montos por puesto, brecha real y reparto por Grupo |
| Reporte | Descarga del PDF con todo el escenario |

Se puede navegar con los botones, con las flechas del teclado o con las
secciones de la barra inferior. Cada sección tiene un hash propio, por ejemplo
`#paso-8`, para poder compartir un enlace directo.

## Aleatoriedad ajustable

La semilla hace que un escenario sea reproducible. Además se pueden ajustar:

- Rango de NNJ por Grupo.
- Rango de Guiadoras/Dirigentes con Nivel Medio.
- Cantidad de postulaciones por Grupo.
- Rango y concentración del percentil RSH.
- Peso relativo de cada cargo al postular.
- Probabilidad de Grupos irregulares y estado manual de cada Grupo.

Los datos son ficticios: no se usan nombres ni antecedentes reales.

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

## Reporte

El botón **Descargar PDF** genera un documento A4 con:

- Fecha, semilla y parámetros utilizados.
- Resumen del fondo, la demanda y la cobertura.
- Gráfico de asignación por puesto.
- Ranking completo con montos.
- Dotación y resultado por Grupo.
- Nota metodológica.

La generación del PDF se carga de forma diferida para no aumentar el tamaño
inicial de la aplicación.

## Estructura

```
src/
  domain/        Motor de simulación: generación, ranking, asignación y formato
  components/    Componentes de interfaz y secciones de la presentación
  report/        Generación del PDF con jsPDF
  App.tsx        Estado global y navegación
  styles.css     Diseño, animaciones y responsive
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
orden decreciente y la igualdad de montos en empates técnicos.

## Stack

- Vite + React + TypeScript
- jsPDF + jspdf-autotable para el reporte
- CSS propio, sin dependencias de UI ni fuentes externas
