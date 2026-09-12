# HackCMU: capacity on the bus you plan to take

**The project adds current bus capacity to the existing Google routing experience.** Google handles location, destination, walking, routes, and arrival estimates. We match a selected departure to its PRT vehicle and show trustworthy occupancy in our visual frontend. Forecasting capacity when it reaches the rider is a later step, dependent on data.

Recommended track: **Traveling**. Start with the [product brief](docs/PROJECT.md) and [capacity architecture](docs/ARCHITECTURE.md). No application is implemented yet; live occupancy access remains unverified.

## Clone and start

Each teammate needs GitHub access and a separate clone/worktree.

```sh
git clone https://github.com/ethancurb/cmu-hackathon.git
cd cmu-hackathon
```

Open the folder in your coding tool and give its agent this prompt:

```text
Read AGENTS.md and complete its strategy + execution onboarding.
My current ticket/task is: <paste the task or ticket link>.
Use the current PROJECT scope and shared ARCHITECTURE contract.
```

`AGENTS.md` is canonical; `CLAUDE.md` imports it for Claude Code. Supply the prompt explicitly when a tool does not automatically load instructions.

## Shared context

| Need | File |
| --- | --- |
| Winning strategy | [STRATEGY](docs/STRATEGY.md) |
| Product goals, scope, decisions | [PROJECT](docs/PROJECT.md) |
| Data sources, interfaces, verification | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| BusTime API field definitions, read as needed | [Developer guide](DeveloperAPIGuide3_0.pdf) |
| Demo and submission | [DEMO](docs/DEMO.md) |
| Detailed research, read as needed | [RESEARCH](docs/RESEARCH.md) |

People choose their own work through the separate ticket system being built by a teammate. Use it for tasks and status; its link/integration has not been supplied here. This repo contains no fixed role assignments or parallel task ledger.

Keep the build small, share actual contracts, and verify integrated behavior. Main protection and mandatory PRs are not required. The [opening deck](HackCMU%202026%20Opening%20Ceremony.pdf) sets a three-minute presentation/demo and Saturday **September 12, 4 p.m. EDT** submission.
