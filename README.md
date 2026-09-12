# HackCMU: strategy + execution

Four humans, mixed AI/manual coding, one goal: win a track with a distinctive project that works. This repo is the shared context for your coding agents. Humans only need this page and the current [project decisions](docs/PROJECT.md).

**Our project:** help CMU riders decide whether an arriving PRT bus is worth waiting for using evidence about that specific bus's crowding and recent pass-ups. Recommended track: **Traveling**. Read the [product and four-person plan](docs/PROJECT.md) and [proposed architecture](docs/ARCHITECTURE.md).

## The 60-second version

- Choose a track your core idea fits naturally. Give each judging criterion something concrete to inspect.
- Build one memorable end-to-end experience; make the difficult, original part visible. Every extra feature pays for implementation, integration, and demo risk.
- Four owners work in separate checkouts with agreed interfaces. Integrate small changes; one person coordinates shared files and the demo deployment.
- Reserve time to rehearse and submit. Use the actual deadline and format recorded in `PROJECT`.

## Clone and start any coding agent

Each teammate needs access to this private GitHub repository. Use your own clone and a branch named for you or your assigned task.

```sh
git clone https://github.com/ethancurb/cmu-hackathon.git
cd cmu-hackathon
```

Open the folder in your coding tool and give its agent this prompt:

```text
Read AGENTS.md and complete its required strategy + execution onboarding.
My assigned role is <lead / build-a / build-b / demo>.
Work from the current PROJECT decision and my role's handoff.
```

`AGENTS.md` is the canonical instruction file; `CLAUDE.md` imports it for Claude Code. In any tool that does not load them, paste these instructions explicitly. Have the agent state its track, task, scope, contract, and check before it starts.

| Need | File |
| --- | --- |
| Required strategy briefing | [STRATEGY](docs/STRATEGY.md) |
| Current target, proof, ownership, decisions | [PROJECT](docs/PROJECT.md) |
| Stack, commands, component contracts | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| Each developer's small handoff | [team/](team/) |
| Demo and submission | [DEMO](docs/DEMO.md) |
| Detailed event/winner/strategy evidence, read on demand | [RESEARCH](docs/RESEARCH.md) |

No framework or runtime is needed to use this packet. Add product checks with the product. Main protection and mandatory PRs are not part of this workflow.

The [opening deck](HackCMU%202026%20Opening%20Ceremony.pdf) is incorporated: three-minute presentation/demo; Saturday **4 p.m. EDT** submission. The problem and recommended build plan are recorded. The app is not implemented; PRT data access, pilot IDs, and human role assignments still need verification.
