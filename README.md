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
I am working with: <Ethan, Alex, BigMike, or Nate>.
My current GitHub issue/task is: <paste the issue link or task>.
Use the current PROJECT scope and shared ARCHITECTURE contract.
Check open issues before editing; update my ledger with the work you push.
```

`AGENTS.md` is canonical. Claude Code and Gemini CLI import it; Cursor and GitHub Copilot have short instruction pointers to it. Keep repository instructions enabled. Supply the prompt above explicitly in any other tool. Existing agent sessions should reread `AGENTS.md` after pulling this update; a Git pull alone does not refresh an agent's conversation.

For an existing clean checkout on `main`, run `git pull --ff-only origin main`. On a working branch, have your agent fetch and inspect the changes before integrating them.

## Shared context

| Need | File |
| --- | --- |
| Winning strategy | [STRATEGY](docs/STRATEGY.md) |
| Product goals, scope, decisions | [PROJECT](docs/PROJECT.md) |
| Data sources, interfaces, verification | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| BusTime API field definitions, read as needed | [Developer guide](DeveloperAPIGuide3_0.pdf) |
| Demo and submission | [DEMO](docs/DEMO.md) |
| Detailed research, read as needed | [RESEARCH](docs/RESEARCH.md) |
| Current tasks and claims | [GitHub Issues](https://github.com/ethancurb/cmu-hackathon/issues) |
| Published work by person | [Ethan](ledgers/ethan-ledger.md), [Alex](ledgers/alex-ledger.md), [BigMike](ledgers/bigmike-ledger.md), [Nate](ledgers/nate-ledger.md) |

People choose their own work in GitHub Issues. Agents read and publish task scope there before editing, then commit a short entry in their human's ledger with each push containing new work. Issues hold current status; the four ledgers hold verified history. There are no fixed role assignments or new tracking services. Use the GitHub web UI or authenticate the GitHub CLI as the correct teammate (`gh auth login`, then `gh issue list --state open`).

Keep the build small, share actual contracts, and verify integrated behavior. Main protection and mandatory PRs are not required. The [opening deck](HackCMU%202026%20Opening%20Ceremony.pdf) sets a three-minute presentation/demo and Saturday **September 12, 4 p.m. EDT** submission.
