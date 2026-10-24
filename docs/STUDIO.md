# Studio: always-on game pipeline

Goal: highest portal ad revenue per owner-minute. Claude builds 24/7 within a quota budget;
the owner only decides (inbox) and submits. Read with docs/AUTOPILOT.md (run rules).

## Analysis (2026-10-24)
- **Market is hit-driven.** Portal revenue comes from a few games that win traffic tests.
  More released games = more lottery tickets → a portfolio beats polishing one game.
- **But building is not the bottleneck.** CrazyGames: human QA (~1–2 days), then a ~2-week
  limited-traffic "Basic Launch" test before full launch; 2–4 weeks from submit to real data.
  Poki is invite/selective. Bottlenecks: (1) owner submission time (accounts, forms, covers),
  (2) portal review/test time, (3) owner playtest verdicts. A factory that outruns these
  only makes unreleased games → wasted quota.
- **Quota cannot be read by Claude** (no tool exposes usage). Budget is set by *run count*:
  the schedule below is the budget. A run that hits the limit just fails; the next run retries.
- **No trend data source here.** WebSearch works but 2026 genre rankings found are low quality;
  portal sites/CDNs are blocked from the container. Trend scouting = web search + owner's eye
  on portal front pages (2 min, optional).
- **Reuse is the multiplier.** Counter Champ's platform adapter, ad flow, save, smoke/portal tests,
  Pages deploy and docs are ~40 % of a game. Extract once into a template → each new game starts there.

## Operating model
1. **Release first.** Counter Champ goes to CrazyGames before any new game takes > 1 run.
2. **Prototype lab.** One run = one grey-box prototype (core loop only, ~45 s fun test, Pages link).
   Owner plays 2 min on phone → Keep / Kill in the inbox. No verdict → no further work on it.
3. **Production.** Kept prototype → milestones M1–M6 like Counter Champ (feel, progression,
   portal, responsive, release kit). Max **1 game in production** at a time.
4. **Measure.** Released games: owner pastes portal stats into the inbox weekly; Claude proposes
   the next 3 changes or a variant (same engine, new theme). Kill rule after 3 weeks of weak numbers.
5. **Themes.** "Current stories" = timely skins on proven mechanics (seasonal events, sports
   events, viral memes kept PEGI-12 and brand-free; no real people, no trademarks).

## WIP limits
- Owner decision (2026-10-24): use all idle quota. Prototypes do NOT wait for owner picks:
  Claude builds the top-scored concepts itself; the owner only plays and marks Keep/Kill.
  Only Keep games get submitted.
- Max 6 prototypes waiting for a verdict (then: polish the best-scored one instead), 1 game in production.
- Each run: one task, time-box ~45 min, tests green or nothing is pushed. `git pull --rebase`
  right before push (parallel runs).

## Budget (schedule = quota)
- Hourly, 24/7, until the limit is hit; a run that hits the limit just fails, the next one retries.
- Risk: the weekly cap can also block the owner's own daytime use. Owner says "dur"/"yavaşla" →
  Claude disables the task or drops to nights only.

## Board (top = next). Autopilot takes the first unblocked line, marks it, appends the result.
- [ ] CC-M6: Counter Champ release kit + final review (Opus) – scheduled tonight
- [ ] CC-FIX: fix M6 review findings (Sonnet)
- [ ] STUDIO-TEMPLATE: `template/` in this repo (platform adapter, ads flow, save, smoke/portal tests,
      docs skeleton) + Pages workflow also builds `prototypes/<slug>/` to `/proto/<slug>/` and an
      index page listing them. Moves to `game-studio` once the owner creates it. (Sonnet)
- [ ] SCOUT: 10 concepts scored (fun in 10 s, one-thumb, proven web mechanic, timely theme, build
      cost) in docs/CONCEPTS.md; add PROTO lines for the top 6 to this board. (Opus)
- [ ] PROTO-n: grey-box prototype from the template, playable Pages link, smoke test; Keep/Kill
      line in the owner inbox. (Sonnet)
- [ ] When no PROTO is unblocked: polish the highest-scored prototype without a Kill (one feel/
      juice pass per run).

## Owner inbox (owner answers here or in chat; newest on top)
- [ ] Optional: create empty public repo `seydiburakgayretli/game-studio` (Claude's GitHub app cannot create repos); until then prototypes live in `prototypes/` here.
- [ ] Submit Counter Champ to CrazyGames after CC-M6 (steps will be in PROGRESS.md).
- [ ] Phone check of Counter Champ (Pages link), both orientations.
