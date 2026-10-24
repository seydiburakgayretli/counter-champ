# Counter Champ (working title)

Tiny HTML5 arcade game for CrazyGames first, Poki later. Product owner decides, Claude builds.
Stack: Vite + TypeScript + Phaser 3.90, static build into `/dist`. Portal SDKs sit behind one
adapter in `src/platform/`. Concept status: see docs/GDD.md (draft until the owner picks).
Repo: `seydiburakgayretli/counter-champ`, branch `main` (Pages deploys from it). Never use `car-advisor`.
Talk to the owner in Turkish. Answers: short and plain (max ~8 lines), no long lists; details go to docs. Code, comments, docs and game UI in English.

## Commands
- `npm run dev` – dev server (local platform, fake ads)
- `npm run build` – typecheck + build into dist (local platform)
- `npm run build:crazygames` / `npm run build:poki` – portal builds (mode = platform flag)
- `npm run typecheck`

## Conventions
- Small, targeted edits; no file rewrites. Strict TS, no `any`.
- No per-frame allocations; pool objects (particles, pop-ups, sprites).
- Procedural/vector graphics and generated sound (WebAudio). No large assets.
- `gameplayStart` on first player input only; `gameplayStop` on pause/menu/game over; never twice in a row.
- Ads only at natural breaks. Rewarded ad is optional (e.g. continue once).
- No trackers or external services except the portal SDK.

## Market rules (condensed)
Fun in 10 s, no text tutorial, first input starts play. Runs 30–120 s, restart < 1 s, best
score visible, small unlocks. One-thumb/one-key; touch, mouse, keyboard. Portrait + landscape,
responsive, no scroll. Download < 5 MB (hard max 8 MB), loading indicator. Juice: hit-stop,
shake, particles, punchy SFX, pop-ups. PEGI 12: cartoon impacts, no blood. One clean art style.

## Session start (token rules)
Read only: this file, last entries of docs/PROGRESS.md, current milestone in docs/PLAN.md.
Don't re-read unchanged files or paste large files. One milestone per session. At the end:
append PROGRESS.md, tick PLAN.md, commit and push. Keep messages short: changed / how to test / need.

## Quality bar (before a milestone is done)
Build passes, bundle size reported, no console errors, headless Playwright smoke test
(load, input, reach game over) passes, list 3 changes that would most improve fun.

## Session coach (warn the owner every time)
- New session: when a milestone is done, the chat is long / earlier decisions fade, or the task
  switches. Update PROGRESS.md first, then end with:
  "⚠️ Yeni oturum öner: PROGRESS.md güncellendi, /clear yapıp yeni oturumda devam et."
- Compact: long session, task not finished → tell owner to run /compact and what to keep.
- Model: "🔁 Model öner: /model [name], çünkü [one short reason]."
  Opus: concept, design decisions, architecture, bugs failed twice, final pre-release review.
  Sonnet: normal implementation, art/audio passes, refactors, tests, docs.
- Model check at session start (every new session, incl. after /clear): before the first edit,
  compare the model you are running as (system prompt) with the model the next task needs
  (use the Opus/Sonnet rules above; PLAN.md milestone "Model:" tag wins if present). If they
  differ, your FIRST reply line is the 🔁 warning, then wait for the owner's switch or "devam"
  before doing the work. A new session resets the ignore rule below, so warn again every time.
  End each milestone by naming the recommended model for the next one in PROGRESS.md "Next:".
  Never do Opus-class work on Sonnet (or cheap work on Opus) silently.
- Never repeat an ignored warning in the same session unless things got worse.

## Compass: say no
Goal: a game that earns money with the least owner time. Push back when a request adds scope
to the milestone, breaks a market rule, busts the size budget, delays release without more fun
or revenue, or starts a second game early. Say: why (1 sentence), cost, smaller alternative —
then do the alternative unless the owner says "yine de yap". If insisted: do it and log it in
PROGRESS.md under "Overrides". New ideas mid-milestone → docs/IDEAS.md (reviewed after release).
Kill rule: weak portal numbers after 3 weeks → say plainly: stop polishing, start next game.
Be honest about fun; if it isn't fun, propose the single biggest fix. No flattery.

## Money focus
End every milestone with "💰 Gelire etkisi:" (plays, play time or ad revenue).
Prefer first-10-seconds, retention and natural ad breaks over rarely seen features.
After release: analyze shared stats, propose the next 3 highest-impact changes or a variant.

## Docs
- docs/GDD.md – design (max 2 pages) · docs/PLAN.md – milestones + acceptance
- docs/PROGRESS.md – append-only log (+ Overrides) · docs/IDEAS.md – parking lot
- docs/PORTAL_CHECKLIST.md – CrazyGames + Poki requirements vs current build
- docs/AUTOPILOT.md – rules for unattended scheduled runs (no owner present)
- docs/STUDIO.md – studio pipeline: analysis, board, owner inbox, budget
