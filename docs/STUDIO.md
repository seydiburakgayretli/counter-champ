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

## WIP limits (protect quota)
- Inbox has ≥ 3 open owner decisions → no new prototypes; only release/polish tasks or stop.
- Max 2 prototypes waiting for verdict, 1 in production, unlimited released.
- Each run: one task, time-box ~60 min, tests green or nothing is pushed.

## Budget (schedule = quota)
- Nights only (owner's daytime quota stays free): 4 runs, 00:07 / 02:07 / 04:07 / 06:07 Europe/Istanbul.
- Owner changes the count or hours by saying so; Claude updates the scheduled task.
- If runs keep failing on limits, drop to 2 runs/night.

## Board (top = next). Autopilot takes the first unblocked line, marks it, appends the result.
- [ ] CC-M6: Counter Champ release kit + final review (Opus) – scheduled tonight
- [ ] CC-FIX: fix M6 review findings (Sonnet)
- [ ] STUDIO-TEMPLATE: extract reusable template (platform adapter, ads flow, save, tests, Pages,
      docs skeleton) – needs repo `game-studio` (owner creates it) (Sonnet)
- [ ] SCOUT: 10 concepts scored (fun in 10 s, one-thumb, proven mechanic, theme hook, build cost),
      top 3 into inbox for owner pick (Opus)
- [ ] PROTO-1..2: grey-box prototypes of the owner's picks (Sonnet)

## Owner inbox (owner answers here or in chat; newest on top)
- [ ] Create empty public repo `seydiburakgayretli/game-studio` (Claude's GitHub app cannot create repos).
- [ ] Submit Counter Champ to CrazyGames after CC-M6 (steps will be in PROGRESS.md).
- [ ] Phone check of Counter Champ (Pages link), both orientations.
