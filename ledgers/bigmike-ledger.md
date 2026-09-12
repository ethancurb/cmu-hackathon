# BigMike's published-work ledger

Follow [the ledger rules](../AGENTS.md#personal-ledgers--update-with-the-work-you-push). Append only BigMike's work; current task status belongs in GitHub Issues.

No entries recorded yet.

2026-09-12T18:01:06Z → [#22](https://github.com/ethancurb/cmu-hackathon/issues/22) → integrated the supplied passenger-free XD60 GLB as a local Map/List/Vehicle view with orbit, pause, ordered cutaway reveal, articulation, posters and honest model labeling.
Added lazy-loaded Three.js rendering, tested reveal/bellows math, responsive browser QA and architecture/provenance notes; pressure, journey and provider contracts are unchanged.
Verified `npm test` 39/39, typecheck, lint, Webpack production build, `qa-vehicle` at 320/390 px, `qa-screens` at 320/390/768/1280 px and `qa-flow`; all passed with zero app console/overflow errors.
`npm run build` Turbopack path hit the host's helper-port `EPERM`; `npx next build --webpack` compiled and prerendered successfully. Physical-phone GPU performance remains untested.
