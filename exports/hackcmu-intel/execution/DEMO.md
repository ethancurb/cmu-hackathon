# Morning proof, three-minute demo, and submission

Use this as a checklist for the receiving project, not as evidence that anything is already implemented. Exact event instructions are in [FACTS](../event/FACTS.md). The supplied deck gives three minutes for presentation and demo together; the sequence below is our recommendation.

## Design the visible proof

| Time | Show | What it establishes |
| --- | --- | --- |
| 0:00-0:20 | One recognizable user problem and the current workaround | Usefulness and context |
| 0:20-1:25 | A real input passing through the core mechanism to a useful result | The product works and the contribution is visible |
| 1:25-2:05 | Change an input/condition; compare with a sensible baseline or show shared interaction | Technical behavior, differentiation, and appropriate evidence |
| 2:05-2:40 | Explain the mechanism, track fit, and the most material limit | Judges understand what was built and what the result means |
| 2:40-3:00 | Buffer and finish | Recovery from small delays without overrunning |

Skip account creation, installation, long loading screens, and file tours during the opening. Prepare actual permissions and devices beforehand. Make the key state change legible from the judge's seat. Show one decisive result instead of racing through ten features.

A rehearsed scenario is legitimate demo preparation. Identify simulated data, cached responses, recorded footage, and manual setup when they affect the claim. A recording can preserve presentation continuity, but it does not prove the service is working live at that moment.

## Verify the complete path

- [ ] Start the candidate from its documented environment and commands.
- [ ] Confirm the core page/entry point is reachable on the intended demo device.
- [ ] Run input -> processing -> persistence/shared state where required -> visible result.
- [ ] Change the input and verify the corresponding output, identity, and state change.
- [ ] For multi-person claims, exercise two real clients and relevant competing updates.
- [ ] For a model/API, verify a real successful path and a slow/failure response if that dependency is part of the claim.
- [ ] For a simulation, inspect decision-time information, future truth, baseline fairness, and at least one scenario unfavorable to the proposed method.
- [ ] Verify the relevant loading, empty, unknown, stale, error, and recovery behavior; select those that matter to this product.
- [ ] Reset and repeat the demo without manual database repair or unexplained hidden setup.
- [ ] Check keys, quotas, permissions, network assumptions, audio/camera availability, and runtime behavior actually needed by this demo.
- [ ] Record exact commands, exit/results, timestamp, candidate revision, and anything untested.

Do not write tests that merely repeat the implementation or preserve a stub. Choose checks that challenge behavior and boundaries. A build passing verifies compilation; it is not a substitute for operating the product.

## Make each claim auditable

| Claim | Evidence needed before saying it |
| --- | --- |
| "Live" | Actual request/device observation with source and relevant timestamp; identify any simulated layer |
| "Predicts" | Defined target/horizon and an implemented predictor; distinguish it from authored future values |
| "More accurate / faster / better" | Named baseline, inputs/sample size, method, observed result, and limits |
| "Multi-user" | Demonstrated interaction and shared state across distinct clients |
| "Uses sponsor X" | Actual integrated use of that sponsor service and the visible job it performs |
| "Scales" | Relevant measured behavior or a clearly labeled estimate with checked arithmetic and assumptions |
| "Working" | Reproducible useful flow, not just a screenshot, seeded table, or a passing build |
| "Submitted" | Actual organizer submission confirmation and recorded submitted links/revision |

Avoid precise probabilities or impact claims without an evaluation supporting them. Generated confidence is not calibration. A successful toy simulation does not justify real-world accuracy or operational claims.

## Cold review

Have someone who did not build the slice operate or watch it without coaching. They should be able to identify the user, useful result, distinguishing mechanism, technical contribution, and main-track fit. Confusion identifies a product or explanation issue to repair before adding features.

An independent agent can check code/runtime and challenge claims, but it cannot fully substitute for a human's experience of the presentation. Reserve morning time for that check.

## Morning handoff contents

Keep the top-level handoff brief and link to detail:

1. **Run it:** exact repo/branch/revision, prerequisites, startup command, local URL, required environment variable names, reset command, and known data mode. No secret values.
2. **What works:** the demonstrated user flow and relevant observed checks.
3. **Why it matters:** the main-track thesis, technical mechanism, and evidence against the selected baseline/workaround.
4. **Limits:** unimplemented features, simulated inputs, unverified claims, unresolved provider/organizer dependencies, and known bugs.
5. **Demo:** three-minute sequence, prepared scenario, fallback, and what needs rehearsal.
6. **Next:** the smallest repairs or submission actions in priority order; explicit feature freeze and delivery times.

Do not make the waking human reconstruct progress from a long transcript, scattered reviewer reports, or every worker's local branch.

## Submission preparation

- [ ] Obtain the actual Google Form and verify all fields and access requirements.
- [ ] Select one main track; prepare the 50-word track-fit explanation requested by the public listing.
- [ ] Verify any chosen sponsor category's current requirements and entry field.
- [ ] Describe the finished scope, with appropriate provenance and disclosures.
- [ ] Test submitted URLs from the judge's likely access level; inspect authentication restrictions and device behavior.
- [ ] Record the submitted revision/candidate, links, and confirmation before **September 12, 2026, 4 p.m. EDT**.
- [ ] Find the assigned judge room/time and any current organizer instructions.
- [ ] Clarify post-submission code policy before changing the submitted candidate afterward.

The former team's 3:30 p.m. submission target was a buffer, not an official extension or deadline. Use the time remaining and preserve the last known-good candidate.
