# Autopilot (unattended runs)

Used when a run is started by a scheduled task while the owner is away (prompt starts with
"AUTOPILOT"). These rules override "wait for the owner" parts of CLAUDE.md for that run only.

## Start
1. `git pull origin main`. Read CLAUDE.md, last PROGRESS.md entry, PLAN.md.
2. If the last commit is less than 10 min old and not from an autopilot run, the owner is
   working: stop without changes.
3. Pick the run's task: the prompt's task, else the first unblocked line of the Board in
   docs/STUDIO.md (respect its WIP limits). Mark it "in progress (date)" first and push, so a
   parallel run skips it. Nothing unblocked → stop without changes.
4. Model check: no waiting. If the model does not match the milestone tag, do it anyway and
   note it in PROGRESS.md (the owner set the model for this run).

## Instead of asking the owner
- Pick the safest reversible default, do it, and log it in PROGRESS.md under
  "Autopilot decisions (owner review)" – one line: decision, why, how to undo.
- Owner-only items (phone playtest, real portal QA, accounts, submission, payment): prepare
  everything, write exact steps in PROGRESS.md "Need", tick only the code part.
- No network to portal docs/CDNs here: never claim SDK calls are verified; list them as
  "verify in QA tool".

## Never (even on autopilot)
- Submit to a portal, create accounts, touch `car-advisor`, force-push, rewrite history.
- Skip/disable a test to get green. Start a game that is not on the Studio board. Add scope beyond PLAN.md
  (ideas → IDEAS.md).
- Push a red build: build, typecheck, `npm run smoke`, `npm run test:portal` must pass.
  If they can't be made green in the run, commit nothing to `main`; log the failure.

## End
Append PROGRESS.md (Done / Bundle / Autopilot decisions / Need / Next + model), tick PLAN.md
and the Board line, add owner questions to the STUDIO.md inbox,
one commit, `git push origin main`. Time-box: stop after ~60 min of work and log where you are.
