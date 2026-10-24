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
(New games paused by owner 2026-10-24; current focus: Counter Champ alternatives, see Board.)
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
- Owner decision (2026-10-24, later): stay in this repo, no new games. Use idle quota to explore
  10 alternatives of Counter Champ (game model, art style / design language, engine).
- Each task goes only up to the owner's decision point: playable link + short comparison +
  one Keep/Kill/Merge question in the inbox. Then the next task starts; nothing waits.
- Each run: one task, time-box ~45 min, tests green or nothing is pushed. `git pull --rebase`
  right before push (parallel runs).

## Budget (schedule = quota)
- Hourly heartbeat 24/7 + chaining: a run that finished a task and sees more unblocked work
  fires the next run at once (see AUTOPILOT.md "End"). A run that hits the limit just fails.
- Risk: the weekly cap can also block the owner's own daytime use. Owner says "dur"/"yavaşla" →
  Claude disables the task or drops to nights only.

## Board (top = next). Autopilot takes the first unblocked line, marks it, appends the result.
- [x] CC-M6: Counter Champ release kit + final review (Opus) – done 2026-10-24
- [x] CC-FIX: fix M6 review findings – the one finding was fixed inside CC-M6
- [ ] ALT-00: alternatives infra: `alts/<nn-slug>/` (own index.html + entry, may import from `src/`),
      `npm run build:alts`, Pages builds main game at `/` and each alt at `/alts/<nn-slug>/`, plus
      `/alts/` index page with one card per alt (name, one line, status). Smoke test per alt
      (load → input → game over). Main game untouched. (Sonnet)
- [ ] ALT-01 Dodge & Counter (model): swipe up / second key = dodge; some punches can't be
      blocked, only dodged → dodge then counter for x2. Tests depth vs. one-thumb simplicity.
- [ ] ALT-02 Rhythm Fighter (model): punches land on a music beat (generated WebAudio loop);
      counters on the beat score more; tempo rises per rival. Tests "flow" retention.
- [ ] ALT-03 Boss Rush (model): one big rival per run with 3 phases and new tells per phase,
      60–90 s runs, best time to KO. Tests mastery vs. endless.
- [ ] ALT-04 Four-Way Brawl (model): attackers from 4 sides (tap the quadrant / arrows),
      crowd of small opponents. Tests chaos/juice vs. readability.
- [ ] ALT-05 Glove Shop (meta): coins per run, buy upgrades (extra heart, wider perfect window,
      combo shield) between runs. Tests retention / session count.
- [ ] ALT-06 Pixel Retro (art): same game, 8-bit pixel look (procedural pixel sprites, chiptune SFX).
- [ ] ALT-07 Neon Night (art): flat neon / synthwave, glow lines on dark, bloom-like flashes.
- [ ] ALT-08 Doodle Paper (art): sketchy hand-drawn lines on paper, wobble animation.
- [ ] ALT-09 Animal Boxers (design language): cartoon animal cast (bear, cat, rooster…),
      each with a funny tell and KO pose. Tests character appeal for thumbnails/clicks.
- [ ] ALT-10 No-Engine (engine): core loop in plain Canvas2D + TS without Phaser; compare
      gzip size (now 341 KB), load time, fps, code size.
- [ ] When no line is unblocked: polish the alt with the most "Keep" answers (one pass per run).

Per ALT, decision point = playable `/alts/<nn-slug>/` link, smoke test green, 5 lines in
docs/ALTS.md (hypothesis, what changed, size, cost to bring into the main game, risk) and an
inbox line: "ALT-nn: Keep / Kill / Merge into main?".

## Owner inbox (owner answers here or in chat; newest on top)
- [ ] Submit Counter Champ to CrazyGames: zip + covers in `release-assets/`, steps in docs/RELEASE.md (~15 min).
- [ ] Look at the covers in `release-assets/covers/` – OK as is, or want a drawn cover later?
- [ ] Phone check of Counter Champ (Pages link), both orientations.
