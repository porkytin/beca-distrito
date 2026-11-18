# AGENTS.md

This is a single-page web app that simulates the District grant system.

The app lets the user adjust the random scenario and the grant parameters, walk
through the mechanism step by step, and download a PDF report of the simulation.
Everything runs in the browser: there is no backend and no data leaves the device.

## Stack

- Vite + React + TypeScript
- jsPDF + jspdf-autotable for the report (lazy-loaded)
- Plain CSS, no UI or icon libraries

## Commands

- `npm run dev` — start the development server
- `npm run build` — type-check and build to `dist/`
- `npm run preview` — preview the production build
- `npm run check` — property checks for the simulation engine

## Structure

- `src/domain/` — pure simulation engine: seeded generation, ranking, buckets,
  ties, allocation curves, formatting, defaults.
- `src/components/slides/` — one component per presentation section.
- `src/components/ui.tsx` and `src/components/Icon.tsx` — shared UI primitives.
- `src/report/pdf.ts` — client-side PDF report.
- `src/App.tsx` — global state, derived simulation, hash navigation.
- `src/styles.css` — design system, animations and responsive rules.
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
results). Do not introduce remote assets or server calls.
