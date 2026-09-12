# Execution facts

No application exists yet. The lead replaces the open entries when the product is chosen. Keep real commands and interfaces here; do not invent them in a task or chat.

## Environment and commands

| Fact | Current value |
| --- | --- |
| Stack + pinned runtime/package manager | Unselected |
| Install | Not configured |
| Development | Not configured |
| Verification/build | Not configured |
| Core-flow smoke check | Not configured |
| Deployment URL + deploy command/owner | Not configured |
| Required environment variable names | Not configured; values stay outside Git |
| Shared files and migration owner | Lead; actual paths assigned with the stack |

## Component boundary

Before producer and consumer work diverge, record the canonical schema/type file, exact request/response example, errors/timeouts, side effects, and one shared verification fixture. Both components use the same definition. Prefer a small additive change; coordinate any breaking change with the affected owner.

No boundary has been selected. Replace this paragraph with the real files and examples; keep lengthy definitions in code, with links here.

## Runtime isolation

Separate checkouts do not isolate ports, databases, migrations, or provider quotas. Assign distinct development ports/data where needed. Keep fixture mode explicit and validate the live path before presentation. The demo owner records the candidate and recovery steps in [DEMO](DEMO.md).
