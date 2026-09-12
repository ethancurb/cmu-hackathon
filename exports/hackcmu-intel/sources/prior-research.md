# Prior research: archival reference

This preserves the complete substantive text of the previous repository's `docs/RESEARCH.md`, researched September 11, 2026. Local navigation and the old task-queue link were adapted for portability. It is historical supporting research, not active instructions or the replacement project's specification.

Use [current event facts](../event/FACTS.md), [current sponsor briefing](../event/SPONSORS.md), and [the agent brief](../AGENT_BRIEF.md) first. Mentions of PROJECT/ARCHITECTURE/ledgers below describe the former workflow; their links now lead to the receiving-project launch/workflow guidance. Check current sources before relying on any earlier event or provider assertion.

---

# Winning a HackCMU track

The strongest working hypothesis is a narrow, distinctive experience with a real technical centerpiece, a useful outcome, obvious track fit, and convincing proof inside three minutes. The team should optimize for that complete judged result. Feature count, generated code, infrastructure sophistication, and number of sponsor logos are poor substitutes.

This report supports decisions; it is not required reading before every task. Every agent reads the distilled [STRATEGY](../strategy/PLAYBOOK.md), then works from [PROJECT](../prompts/BOOTSTRAP.md) and [ARCHITECTURE](../execution/OVERNIGHT.md). Consult the sections below when selecting an idea, changing tracks, challenging an assumption, or preparing the demonstration.

## HackCMU 2026

This is **HackCMU 2026: Midnight Express**, organized by ACM@CMU, September 11–12. It is distinct from ScottyLabs' [TartanHacks](https://2026.tartanhacks.com/). Evidence was checked September 11, 2026. The supplied [opening ceremony deck](opening-ceremony.pdf) fills important gaps in the [official event site](https://www.acmatcmu.com/hackcmu2026/) and [Devpost listing](https://hack-cmu-2026.devpost.com/).

Page references below are one-based PDF pages. Current organizer clarifications can supersede this snapshot; record consequential updates in `PROJECT` and the affected briefing. Historical rules and generic MLH guidance do not override this event's instructions.

| Decision-relevant fact | Evidence |
| --- | --- |
| Teams may have up to four people. | Deck, p. 6. |
| Hacking starts Friday at 9 p.m.; projects are due Saturday at 4 p.m. | Deck, pp. 8–9, 51. The [Devpost schedule](https://hack-cmu-2026.devpost.com/details/dates) specifies September 12, 4 p.m. EDT. |
| The resulting scheduled coding-to-submission interval is 19 hours. | Arithmetic from those times; the event's “24 hours” description includes other activities. |
| Four main themes: Optimization, Traveling, Multiplayer, Food. IFM is also listed as optional. | Deck, pp. 16–20. |
| A project fitting several main tracks must choose one at submission. | Deck, p. 21. |
| Any language or AI is allowed; applications must be made from scratch. | Deck, p. 21. The [web rules](https://hack-cmu-2026.devpost.com/rules) prohibit starting project building/design before the event, while permitting brainstorming and team formation. |
| Presentation and demo share three minutes; judges operate in three rooms, with assignments in a spreadsheet. | Deck, p. 33. This does not say each team visits all three rooms. |
| Judging considers originality, technical difficulty, demo quality, usefulness, and track relevance. | Deck, p. 35. Relevance applies to track judging. No weights or tie-break procedure are supplied. |
| Technical difficulty distinguishes substantive technical challenges from a generic ChatGPT wrapper. | Deck, p. 35. |
| Submit using a Google Form; expo/showcase is scheduled 4–6:30 p.m. | Deck, pp. 9, 34, 51. An event page or working deployment is not a submission receipt. |
| Mentors offer Discord tickets and Saturday 10 a.m.–1 p.m. office hours in TEP Simmons B. | Deck, p. 23. |

The [Devpost overview](https://hack-cmu-2026.devpost.com/) additionally asks for a 50-word track-fit explanation and describes track prize depth as dependent on participation. Prepare the explanation. The deck shows prizes for first, second, and third, but does not resolve whether every track receives all three placements (pp. 39–40). Treat allocation as uncertain until the form or organizers clarify it.

Remaining material unknowns are the Google Form URL and exact fields, assigned judging slot, Q&A allowance, post-submission coding policy, IFM/sponsor entry requirements, prize stacking, and any required credit for reused libraries/data/assets or AI. General AI permission is already confirmed. Devpost's participant eligibility wording is inconsistent; consult current organizers if that affects a member. Do not turn these unknowns into invented restrictions or block unrelated work.

## Track and sponsor choice

The deck's theme descriptions are broad. The following interpretations are decision aids, not extra eligibility rules. Select the idea's strongest natural fit, then make that fit visible in the core action.

| Main track | A strong evidence direction | A weak fit to avoid |
| --- | --- | --- |
| Optimization | Define an objective and constraints; compare a useful solution with a sensible baseline. Show what improves and what tradeoff changes. | Calling an ordinary workflow “optimized” without showing an objective or improvement. |
| Traveling | Improve a concrete journey, exploration, access, or planning decision; demonstrate the consequence for a traveler. | A map or travel-themed skin with no meaningful travel outcome. |
| Multiplayer | Make interaction between people essential; demonstrate at least two participants and meaningful shared behavior. | A single-user tool whose only social feature is a share button. |
| Food | Improve a concrete food decision, preparation, access, coordination, or waste problem with relevant inputs and an observable result. | A generic chatbot relabeled for food without a distinctive workflow. |

The primary track is the objective. A secondary prize is worth considering when the same work makes the core product stronger. Do not run a second product campaign with the same four people.

The deck lists Grand, track, IFM, Cursor, Sandia, People's Favorite, Best Design, and MLH prizes (p. 37). Sandia's announced topic is cybersecurity (p. 45). The six MLH awards concern Gemini API, ElevenLabs, Solana, Vultr, Auth0, and MongoDB Atlas (p. 46). IFM appears as an optional track and a separate prize (pp. 16, 41); its exact submission relationship needs confirmation. Sponsor tables and logos alone do not establish award requirements.

For a proposed sponsor integration, answer: What useful job does it perform? What observable behavior would disappear without it? Can the team demonstrate real use and meet the specific entry requirements? What implementation, account, latency, deployment, and presentation costs does it add? Keep it only if the answers justify that cost. Adding unrelated authentication, a token, or a second model purely for another entry can weaken the primary track submission.

Track popularity is at most a tie-break consideration after fit, differentiation, and feasibility. Counts may be unavailable, prize depth can vary, and entrant count does not measure entrant quality. No defensible winning probability follows from these sources. Check the form early so the selected track and any optional entries are actually recorded.

## Historical projects

This is a small sample of public HackCMU records, not a complete ranking. “Confirmed award” means an organizer winner list or the Devpost event-assigned winner field; a project's own title, screenshot caption, repository name, or portfolio remains a team claim. Implementation descriptions are also team reports, not independent audits of the event-time code.

| Project | Award evidence | What the published project makes concrete |
| --- | --- | --- |
| Medicly, 2025 | **Grand Winner confirmed** by [ACM@CMU's winners page](https://www.acmatcmu.com/hackcmu2025/). | The [creator's write-up](https://www.aarushagarwal.dev/projects/Medicly) connects camera pose estimation and motion features to physical-therapy feedback and clinician review. The technical story is attached to observable movement. The award does not validate clinical efficacy or every feature on today's portfolio. |
| DebateZero, 2024 | **Overall win reported by the team**, including its [repository](https://github.com/srianumakonda/DebateZero) and [creator portfolio](https://srianumakonda.com/index.html); no independent organizer mapping established here. | Audio/visual debate analysis supplies an unusual presentation surface. Its win claim and any claim that behavior reveals truth or bias require separate evidence. |
| Space JEDI, 2023 | **Space-track win reported by a creator**; the [submission](https://devpost.com/software/junk-elimination-and-debris-interception-jedi) is public, with the award described in the [portfolio](https://yashmaurya.com/). | Orbital-debris analysis and visual planning turn a specialized problem into something inspectable. This is evidence of a distinctive concept, not verified operational aerospace performance. |
| GEOVID @ CMU, 2021 | **First place confirmed** in the [Devpost winner field](https://devpost.com/software/geovid-cmu). | Campus crowd visualization addresses a recognizable student decision. The write-up explicitly describes generated movement paths and further prediction-model integration as future work: a useful boundary between prototype and completed functionality. |
| MAGC Map, 2021 | **Third place confirmed** in the [Devpost winner field](https://devpost.com/software/magc-map). | Collaborative knowledge maps offer a visibly different interaction from linear documents, built with ordinary web technologies. An original interaction need not require an exotic stack. |
| LoVR, 2019 | **First prize reported on the team's [project page](https://devpost.com/software/lovr-find-real-dates-through-vr)**; the reviewed page lacks an event-assigned winner field. | A VR encounter makes a dating concept experiential. The page places gesture capture in future work, so it should not be described as a fully implemented capability. |

The official 2025 page also names null_pointer, Cortex Cam, RepCheck, and Driftwords as track winners, and heXray as its Anthropic prize winner. That confirms a variety of recognized categories; it does not establish 2026 tracks or sponsor preferences. The official page is JavaScript-rendered; its winner mapping was available in the search-index extraction of that exact organizer URL. [ACM@CMU 2025](https://www.acmatcmu.com/hackcmu2025/).

The useful inference is about presentation structure: these concepts expose a recognizable action and a distinctive result. A crowd map, a changed interaction, or movement feedback lets a judge inspect the technical idea through the product. That supports building the differentiator into the demonstration itself.

The sample is biased toward surviving pages and teams who publicized awards. It lacks a comparable set of near-winners, judges' scores, and verified final builds. It cannot show that a domain, model provider, hardware choice, or visual style caused a win. Avoid copying a past winner's surface or repeating its unverified accuracy/impact claims. Use history to generate testable design questions, then judge the current project against the current rubric.

## Strategy evidence

The primary guidance below supports specific habits, with important differences in context.

| Source | Evidence and limit |
| --- | --- |
| [Devpost: advice from five seasoned judges](https://info.devpost.com/blog/hackathon-judging-tips) | Judges describe baseline eligibility checks, understanding a project through its demo, attention to usability and explanation, and skepticism toward thin implementations or awkward contest fit. Their individual priorities vary; this is practitioner testimony, not a measured winning formula. |
| [Devpost: submission and judging criteria](https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria) | Requirements such as eligible technology, accessible links, and submission assets need checking early. This is general platform guidance; HackCMU's actual form and slides control. |
| [MLH: judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan) | MLH recommends brief demos and multiple independent looks, emphasizing creative technology rather than only startup prospects. Its science-fair recommendation does not replace HackCMU's announced room-based presentations. |
| [Devpost: demo-video tips](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video) | Plan the story, make behavior understandable, and reserve time for recording/upload/access checks. HackCMU's supplied materials do not make a video mandatory. |

Synthesis for this team: prove technical ambition through an understandable action; cover every announced criterion; reduce the chance that a judge never sees the good work. A business model, market-size slide, or elaborate architecture diagram deserves time only when it strengthens the actual explanation. The present rubric includes practical need but does not require a startup pitch.

Originality can come from a fresh constraint, interaction, combination, feedback loop, or application of a technical method. It need not mean inventing every primitive. Conversely, familiar APIs assembled without a distinctive outcome may leave both originality and technical difficulty weak. The right target is one difficult, visible mechanism inside a coherent experience.

## Idea review

For initial selection or a proposed pivot, record the agreed decision in `PROJECT` after this short review. Agents may challenge assumptions with evidence, but should not create competing product plans. Compare the proposed idea with at most two narrower refinements; avoid spending the event brainstorming indefinitely. The current confirmed scope is the capacity addition described in `PROJECT`.

1. **Define the promise.** Who is in what situation? What do they do now? What single action and result will the demo show? Why is the chosen track central? Write the track rationale while the scope is still easy to change.
2. **Find the distinctive mechanism.** Identify the real technical challenge and why solving it changes the user's result. Be able to describe it without listing frameworks or model brands.
3. **Check feasibility and rules.** Confirm required input data, credentials, devices, deployment capability, and permitted starting material. Label uncertainties. A core dependency with no credible proof path requires a smaller promise or replacement; an optional uncertainty can be cut.
4. **Test the hardest assumption.** Timebox a real-input experiment, usually 30–45 minutes. Define success before starting: the required result, acceptable latency, valid output, and relevant failure behavior. Keep the experiment's evidence, including failures.
5. **Inspect the complete experience.** Sketch the three-minute proof and component boundary. Resolve missing interfaces and ticket dependencies before parallel implementation diverges.
6. **Choose and cut.** Compare the candidates using the table below. Record the chosen win thesis, at most three must-have outcomes, explicit cuts, and the next proof checkpoint in `PROJECT`. Task selection belongs in GitHub Issues.

| Question | Record for each candidate |
| --- | --- |
| Originality, technical difficulty, usefulness, track relevance | Weak / credible / strong / unknown, with one piece of evidence for each criterion. |
| Demo quality | The visible action/result, estimated time, and steps likely to obscure or break it. |
| Team feasibility | Hardest unknown, who can resolve it, integration cost, and earliest complete proof. |
| Advantage over the current workaround | A concrete comparison, or an explicit plan to obtain one. |
| Cut or pivot trigger | What failed observation would change the decision, and the smaller alternative. |

These judgments organize a discussion; they are not an official weighted score. Prefer demonstrated potential over unsupported ambition, while protecting enough technical substance and originality to compete.

Useful quick evidence includes a teammate performing the task without coaching, two or three relevant people's reactions, or a small disclosed comparison against the obvious workaround. Such observations can expose confusion; they do not prove market demand or broad model accuracy. A metric needs its input set, sample size, baseline, and limits.

Revisit the idea only when new evidence changes a major assumption: the core method fails, a needed resource is unavailable, the track interpretation changes, or a much smaller version preserves the same value. A late suggestion must state its benefit, full cost, and what existing work it replaces. Curiosity alone is not a reason to pivot four people.

## Build and proof schedule

The schedule below is an internal default, not an organizer mandate. Plan from **Saturday, September 12, 4 p.m. EDT**. If starting late, use the remaining time and cut scope; do not restart a fictional 24-hour clock. Record agreed checkpoints in `PROJECT`.

| Checkpoint | Required evidence and response to failure |
| --- | --- |
| First 45 minutes of project work | Choose the primary track and narrow promise; run the riskiest experiment and agree the first contract. If the core is infeasible, narrow or replace it now. |
| Within the next 2–3 hours | One rough real input → processing → visible result across the intended boundary, reachable by another teammate. If it is still disconnected components, integrate or shrink before adding surfaces. |
| By Saturday 10 a.m. (six hours before submission) | Feature freeze target: the core and technical centerpiece work together. Cut secondary features; prioritize the missing judged evidence or failure modes. |
| By 1 p.m. (three hours before submission) | A candidate another teammate can reset, operate, and narrate. Prepare final copy, links, proof, and recovery; stop infrastructure changes that do not solve a demonstrated problem. |
| By 3:30 p.m. | Internal submission target, allowing 30 minutes for form/access/upload errors. Verify saved fields and receipt. Keep the presentation candidate stable. |

Do not treat a green unit check as proof of these milestones. Test the actual user flow, the real provider path if the claim depends on it, and the presentation machine. A late fix warrants another relevant rehearsal; changing code after submission depends on the event's actual policy.

## Execution with GitHub Issues and personal ledgers

People choose their own work in [GitHub Issues](../execution/OVERNIGHT.md#minimum-shared-state). Publish intended scope and chosen ownership before editing; keep current progress, blockers, and completion there. The four [personal ledgers](../execution/OVERNIGHT.md#minimum-shared-state) record brief verified history with the work each person pushes. They do not reserve files or duplicate live task status. [AGENTS](../AGENT_BRIEF.md) defines the canonical workflow, including access failures and onboarding. No permanent roles or people-to-component assignments are prescribed.

The boundary must become concrete before parallel producer/consumer work: canonical types/schema, one request/response example, errors, relevant side effects, and a shared fixture. Put executable definitions in code and link them from `ARCHITECTURE`. Do not maintain duplicate contracts in four chats. A field invented by one agent creates integration debt even if its local UI looks convincing.

Coordinate consequential shared changes through the relevant tickets. Within a selected task, agents make routine implementation choices and verify the result. Keep one active writer per file, including when a human switches to manual editing. Coordinate shared lockfiles, migrations, entry points, environment names, and deployments to avoid concurrent incompatible changes. Separate working directories do not isolate databases, ports, or API quotas.

Small, frequent integration and prompt repair of a broken shared build are supported by software-delivery guidance; applying them to this four-person event is an engineering recommendation, not evidence of hackathon win odds. [DORA: continuous integration](https://dora.dev/capabilities/continuous-integration/). Git worktrees provide separate working trees and index/HEAD state, with other repository resources shared. [Git worktree documentation](https://git-scm.com/docs/git-worktree).

When a dependency blocks a task for ten minutes or two failed approaches, report the failing evidence and smallest useful request. Coordinate one repair for a shared failure while other work continues independently. Use the announced mentor channels through a human teammate when they can resolve a concrete blocker; agents should not independently contact organizers.

Plan coverage through the overnight stretch: stagger breaks and leave reproducible progress in the ticket before stepping away. Keep final build and demo recovery steps usable by the team. These are operational precautions for this team's time constraint, not a claim that working all night improves performance.

Keep context small: `AGENTS` for behavior, `STRATEGY` for shared judgment, `PROJECT` for product decisions, `ARCHITECTURE` for interfaces and execution facts, and `DEMO` for delivery. GitHub Issues holds current task state; personal ledgers hold published history. Main does not need protection and PRs are optional. Keep this to existing GitHub capabilities and four short ledgers, without another task database, coordination service, or process-only CI. Unpublished files are not automatically visible to teammates.

## Demo and submission

The three-minute limit makes explanation part of the product design. Our suggested rehearsal allocates about 20 seconds to the user/problem, 75 seconds to the live action and result, 40 seconds to the technical mechanism/comparison, and 25 seconds to usefulness and track fit, leaving 20 seconds spare. Adjust that structure to the product; finish before the limit. Do not assume an extra minute of Q&A from an older HackCMU event.

Give a teammate who did not build the feature a cold viewing. Ask them to identify the user, what happened, what was original, why the technical work mattered, and why the track fits. Their inability to answer identifies work for the presentation or UI. A brief architectural explanation helps when it explains an observed result; a tour of files rarely does.

Make text and state changes readable from a judge's position. Remove setup, sign-in, permission, and loading delays from the opening where possible. Verify the actual device, display, microphone, network, quota, and test inputs needed for the chosen flow. A two-person experience needs two ready clients; an audio-dependent experience needs a workable venue plan.

Rehearse a reset and a failure. Keep a known-good candidate and a permissible backup, such as cached results, a fixture, screenshots, or a recording. Clearly identify the mode. A recorded or cached result cannot establish that a live service currently works, and a fixture cannot substantiate an accuracy claim. Explain what the team built, what external tools do, and the prototype's real limitations without spending the whole pitch on future work.

Use the [DEMO checklist](../execution/DEMO.md) as the current delivery record. Open the Google Form early, check the exact track rationale requirement and optional prize fields, verify all required links from the intended viewer's access level, and save evidence of submission. Record the judging time/room from the organizer spreadsheet. Expo appeal, visual design, and a concise explanation can support the additional announced awards without adding a separate feature set. Voting mechanics and sponsor proof requirements still need their actual instructions.

## Sources

Accessed September 11, 2026. “Undated” means no reliable publication date was established; an event year identifies the event, not a guaranteed last-update date. Linked project descriptions may include development after the competition.

| Publisher / creator | Source and date | Use |
| --- | --- | --- |
| ACM@CMU | [HackCMU 2026 Opening Ceremony](opening-ceremony.pdf), supplied 2026 deck, especially pp. 6, 8–9, 16–21, 23, 33–46, 51 | Current event instructions, themes, rubric, format, prizes. |
| ACM@CMU | [Official event page](https://www.acmatcmu.com/hackcmu2026/), 2026 | Event identity; dynamic page. |
| ACM@CMU / Devpost | [Overview](https://hack-cmu-2026.devpost.com/), [rules](https://hack-cmu-2026.devpost.com/rules), [schedule](https://hack-cmu-2026.devpost.com/details/dates), 2026 | Submission, published deadline, track rationale, rule reconciliation. |
| ACM@CMU | [HackCMU 2025](https://www.acmatcmu.com/hackcmu2025/), 2025 | Organizer-confirmed awards; indexed text of the official page. |
| Aarush Agarwal | [Medicly](https://www.aarushagarwal.dev/projects/Medicly), undated write-up of 2025 project | Team's technical/product description. |
| Sri Anumakonda / DebateZero team | [Portfolio](https://srianumakonda.com/index.html), [repository](https://github.com/srianumakonda/DebateZero), 2024 project | Team-reported award and concept. |
| Space JEDI team / Yash Maurya | [Submission](https://devpost.com/software/junk-elimination-and-debris-interception-jedi), [portfolio](https://yashmaurya.com/), 2023 project | Concept and separately identified award claim. |
| GEOVID team / Devpost | [GEOVID @ CMU](https://devpost.com/software/geovid-cmu), 2021 | Confirmed award; prototype boundaries. |
| MAGC Map team / Devpost | [MAGC Map](https://devpost.com/software/magc-map), 2021 | Confirmed award; collaborative interaction. |
| LoVR team / Devpost | [LoVR](https://devpost.com/software/lovr-find-real-dates-through-vr), 2019 | Concept and self-reported award, not platform confirmation. |
| Devpost, Sara Sitzer | [How to win a hackathon: Advice from 5 seasoned judges](https://info.devpost.com/blog/hackathon-judging-tips), undated | Direct judge interviews. |
| Devpost, Paulina Cardenas | [Understanding hackathon submission and judging criteria](https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria), undated | Requirement and submission guidance. |
| Major League Hacking | [Judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan), undated living guide | General judging-format recommendations; not HackCMU rules. |
| Devpost, Stephanie Rochon | [6 tips for making a winning hackathon demo video](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video), undated | General demo preparation and delivery guidance. |
| DORA | [Continuous integration](https://dora.dev/capabilities/continuous-integration/), undated living guidance | Small integrations and repair feedback. |
| Git project | [git-worktree](https://git-scm.com/docs/git-worktree), current documentation | Workspace isolation and its limits. |
