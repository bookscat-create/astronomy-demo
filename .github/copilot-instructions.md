# Project Instructions

- Keep astronomy calculations pure and in `src/astronomy.ts`; angles are degrees and timestamps are UTC.
- The observer longitude is currently fixed at 0° (Greenwich). Preserve that assumption in labels and documentation unless longitude controls are added.
- Cover coordinate-transform and daily-motion behavior with Vitest tests.
- Keep Three.js scene resources and cleanup inside `src/SphereView.tsx`.
- Before handoff, run `npm test`, `npm run lint`, and `npm run build`.