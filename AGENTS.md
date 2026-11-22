# AGENTS.md

This is a single-page web app for the District grant system. It has two modes:

- **Calculation:** the committee enters Groups, applicants and parameters, and
  obtains the allocation. Data is persisted in localStorage and can be exported
  or imported as JSON.
- **Simulation:** a seeded scenario walks through the mechanism step by step.

Everything runs in the browser: there is no backend and no data leaves the device.
Keep the interface institutional and focused: no promotional language, decorative
gradients, glow effects or selling visuals.

## Stack

- Vite + React + TypeScript
- jsPDF + jspdf-autotable for the report (lazy-loaded)
- Plain CSS, no UI or icon libraries

## Commands

- `npm run dev` — start the development server
- `npm run build` — type-check and build to `dist/`
- `npm run preview` — preview the production build
- `npm run check` — property checks for the engine and manual data

## Structure

- `src/domain/` — pure engine: seeded generation, manual data normalization,
  ranking, buckets, ties, allocation curves, formatting, defaults.
- `src/components/slides/` — one component per simulation section.
- `src/components/calc/` — calculation workspace: data editor, parameters and
  results.
- `src/components/ui.tsx` and `src/components/Icon.tsx` — shared UI primitives.
- `src/report/pdf.ts` and `src/report/csv.ts` — client-side reports.
- `src/useCalculation.ts` — calculation state, localStorage and JSON backup.
- `src/App.tsx` — global state, modes, derived simulation, hash navigation.
- `src/styles.css` — design system and responsive rules.
- `scripts/check.ts` — randomized invariant checks for the engine.
- `scripts/shots.mjs`, `scripts/checks.mjs` — Playwright visual/interaction
  checks; require `npm run dev` to be running.

## Rules of the system

The domain logic follows `Sistema_de_becas_distritales.md`:

- Only applicants from regular Groups are admissible.
- Percentile RSH ascending (lower = more vulnerable) creates RSH buckets.
- Within a bucket: role priority, then lower Nivel Medio / NNJ ratio.
- Ratio differences below the configured threshold produce a technical tie.
- The fund is distributed with the selected curve; no one receives more than the
  course cost; ties receive exactly the same amount.
- The Becas Commission proposes parameters and applies the allocation; the
  Assembly ratifies them. The district team/CVD owns the data and records.

Keep the engine framework-free and deterministic (same seed + config = same
results). Do not introduce remote assets or server calls. Applicant ratios must
always derive from the current Group NNJ and Nivel Medio, never from stale stored
values.
