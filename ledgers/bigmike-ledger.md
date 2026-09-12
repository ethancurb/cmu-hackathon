# BigMike's published-work ledger

Follow [the ledger rules](../AGENTS.md#personal-ledgers--update-with-the-work-you-push). Append only BigMike's work; current task status belongs in GitHub Issues.

No entries recorded yet.

2026-09-12T18:01:06Z → [#22](https://github.com/ethancurb/cmu-hackathon/issues/22) → integrated the supplied passenger-free XD60 GLB as a local Map/List/Vehicle view with orbit, pause, ordered cutaway reveal, articulation, posters and honest model labeling.
Added lazy-loaded Three.js rendering, tested reveal/bellows math, responsive browser QA and architecture/provenance notes; pressure, journey and provider contracts are unchanged.
Verified `npm test` 39/39, typecheck, lint, Webpack production build, `qa-vehicle` at 320/390 px, `qa-screens` at 320/390/768/1280 px and `qa-flow`; all passed with zero app console/overflow errors.
`npm run build` Turbopack path hit the host's helper-port `EPERM`; `npx next build --webpack` compiled and prerendered successfully. Physical-phone GPU performance remains untested.

2026-09-12T19:11:26Z → [#23](https://github.com/ethancurb/cmu-hackathon/issues/23) → added a server-only PRT TrueTime/optional BusTime adapter for 71B inbound at stop 3141, an honest current categorical-load card, and a forward-only device-local 14-day rolling history.
Categories remain categorical; blank/malformed values stay unknown, fetch time is separate from the unavailable measurement time, and prior weeks are not fabricated.
Verified `npm test` 45/45, typecheck, lint and Turbopack production build; live endpoint matched vehicle 6822 then correctly showed PRT's blank passenger field as not reported; responsive Playwright checks passed at 320/390/768/1280 with no overflow or console errors.
Risk/handoff: shared unattended collection still needs a durable store plus scheduler; production should configure `PRT_API_KEY` instead of relying on the consumer HTML; current PRT category coverage is intermittent.
