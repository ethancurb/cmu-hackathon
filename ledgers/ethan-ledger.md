# Ethan's published-work ledger

Follow [the ledger rules](../AGENTS.md#personal-ledgers--update-with-the-work-you-push). Append only Ethan's work; current task status belongs in GitHub Issues.

## 2026-09-12T04:04:36Z — [#1](https://github.com/ethancurb/cmu-hackathon/issues/1)

- Changes: adopted GitHub Issues, added four personal ledgers, linked common coding tools to AGENTS.md, and reconciled workflow references.
- Verification: `git diff --check` passed; local link/import audit passed for 59 links and four ledgers.
- Handoff: pull the published revision and reread AGENTS.md; existing agent conversations need to reload these rules.
- Limits: documentation checks only; no app/runtime or interactive coding-tool sessions tested.

## 2026-09-12T04:37:32Z — [#2](https://github.com/ethancurb/cmu-hackathon/issues/2)

- Changes: added a key-free PRT diagnostic, eight behavior tests, and [data findings](../docs/PRT-DATA.md) on branch ethan.
- Verification: `node --test scripts/probe-prt.test.mjs` passed 8/8; `node scripts/probe-prt.mjs` returned 168 valid live vehicle records with zero occupancy fields.
- Handoff: public vehicle identity/location is available; use the data notes to scope explicit rider crowding reports without waiting for API approval.
- Limits: diagnostic only; no occupancy acquisition, app integration, or UI implemented. Branch publication is not integration into main.
