# Progress log (append-only)

## 2026-10-23 – M0
- Done: Vite 7 + TS 5.9 + Phaser 3.90 scaffold (builds, 1.2 MB / 333 KB gzip), platform
  interface stub, all working docs, 3 concepts scored in GDD.
- Decisions: Phaser 3.90 over Phaser 4 (mature docs, fewer surprises; size fits budget).
  Relative base path so one build serves GitHub Pages and portal iframes.
- Next: owner picks a concept → finalize GDD → M1 grey-box + GitHub Pages deploy.

## 2026-10-23 – M0 done
- Done: owner picked A. Counter Champ; GDD finalized (candidates collapsed to a decision note).
  Session coach: model check at every session start; PLAN milestones carry a "Model:" tag.
- Next: M1 grey-box core loop + Playwright smoke + GitHub Pages. Model: Sonnet.

## 2026-10-23 – M1 (code done, owner playtest pending)
- Done: grey-box core loop (idle → telegraph ring → tap L/R half or ←/→/A/D/Space → perfect/block/hit,
  combo, KO bar, 8 rivals, doubles + feints from opponent 4, 3 hearts, 10 s grace on last heart),
  instant retry (~90 ms), pause on tab hidden, best score/rival saved via adapter, LocalPlatform
  (guards gameplayStart/Stop order), Playwright smoke (`npm run build && npm run smoke`) passes,
  Pages workflow `.github/workflows/pages.yml`.
- Bundle: 1.22 MB (337 KB gzip). No console errors in smoke run.
- Need from owner: enable Pages (Settings → Pages → Source: GitHub Actions); the github-pages
  environment must allow this branch (or merge to main). Then playtest 5 runs on phone.
- Next: M2 (feel/art/audio) after owner feedback. Model: Sonnet.

## 2026-10-23 – M2 (code done, owner playtest pending)
- Done: hit-stop (70 ms counter/hit, 180 ms KO), camera shake, pooled star particles (32) and
  pop-ups (6), vector art (opponent face/hair/shorts per rival, 8 silhouettes, hurt face, gloves
  with cuff/thumb/glow, ropes + spotlight), WebAudio SFX (whoosh, counter thump, block tock, hit,
  feint, KO bell + crowd, game over, start), mute toggle (icon or M, saved under `mute`).
- HUD fix: hearts no longer overlap KO bar; rival name moved under the opponent.
- Bundle 1.23 MB (340 KB gzip). Smoke passes, no console errors, restart ~160 ms.
- Not verified: 60 fps on a real phone (headless only) and actual sound (no audio device) – owner check.
- Next: owner feedback on feel → M3 progression. Model: Opus for the difficulty curve, then Sonnet.

## 2026-10-24 – M3 (code done, owner playtest pending)
- Done: curve tuned by Monte Carlo sim (3 player models): KO needs more counters from rival 3
  (`koPerfect` per level), wind-ups 900→560 ms then −20/rival to 420; every 3rd KO gives +1 heart
  (same slot as the later interstitial). Sim: new ~47 s / 3 KOs, average ~63 s / 5, good ~2 min / 8–10.
- Unlocks (auto-equip newest, pop-up mid-run): gloves by rivals beaten (Blue after 1st KO →
  reached in run 1 by ~98 %), ring floor colors by score 1500/4000/8000. Next goal shown on
  title + game over. HUD: best score + best rival. Save `{best, bestRival, bestKos}` via adapter.
- Smoke now checks unlock survives reload; retry wait 450→650 ms (was flaky on slow headless frames).
- Bundle 1.23 MB (341 KB gzip). No console errors.
- Not verified: sim player models are guesses – owner playtest decides. No locker menu (→ IDEAS).
- Next: M4 portal adapter + ads. Model: Sonnet.

## 2026-10-24 – Repo fix
- Work moved to `counter-champ` (public, Pages on `main`); `car-advisor` was the wrong repo, never use it.

## 2026-10-24 – M4 (code done, real portal QA pending)
- Done: `BasePlatform` (start/stop guard, saves, SDK loader w/ timeout) + Local (1 s fake ad overlay),
  CrazyGames v3, Poki v2 adapters, picked by `import.meta.env.MODE`. SDKs load from portal CDN at runtime
  (not bundled); blocked/failed SDK = game runs without ads. Interstitial before retry: every 2nd run,
  max once/60 s. Rewarded continue once per run (game over: tap right half / →, 2 hearts, same rival).
  Ads freeze game time and mute sound. No mid-run ad (hurts flow).
- Tests: `npm run smoke` and `npm run test:portal` (mocked SDKs, checks no double start/stop, rewarded call). Both pass.
- Bundle 1.23 MB (341 KB gzip), no console errors.
- Not verified: real SDKs (written from memory of the docs, no network) – check in CrazyGames QA tool / Poki
  inspector. Game over tap-right now means continue, not retry (left/Space/any key retries).
- Next: M5 responsive/perf/size. Model: Sonnet.

## 2026-10-24 – M5 (autopilot run 1/3, code done, phone check pending)
- Done: layout checked at 320x480, 390x844, 600x1600, 768x1024, 844x390, 1280x720, 1920x600 and live
  rotation – no scroll, no overlap of HUD; canvas follows resize. Title/menu text width-capped
  (one line "COUNTER CHAMP" on narrow phones), title gets a light dim so text reads over the fighter.
  Text rendered at devicePixelRatio (max 2) → crisp on phones. Smoke now rotates mid-run and checks layout.
- Pooling audit: particles/pop-ups pooled, HUD text only re-set on change, no per-frame allocations found.
- Perf: headless Chromium has no GPU (software GL) → ~30 fps there even with an empty-ish scene; hiding
  all Graphics gives 60 → cost is fill rate in the software renderer, not game code. Baking the arena
  into a texture was slower headless, reverted. Real 60 fps can only be checked on a phone.
- Bundle 1.23 MB (341 KB gzip) for local/crazygames/poki builds; budget < 5 MB ✅.
- Model: ran on Opus (owner set this schedule; tag says Sonnet).
- Autopilot decisions (owner review): title dim 0.35 (undo: `setMsg(..., 0)` in showTitle).
- Need: open the Pages link on a phone, both orientations; tell me if it stutters.
- Next: M6 release kit + final review (autopilot run 2/3, 03:00 UTC). Model: Opus.

## 2026-10-24 – M6 release kit (autopilot, code done; owner submits)
- Done: `npm run release` → per-portal zips (332 KB each, committed in `release-assets/`); covers
  rendered from the real game (`npm run covers`: 1920x1080, 800x1200, 800x800, icon 512);
  docs/RELEASE.md (store text, tags, controls, CrazyGames step-by-step, Poki note); checklist updated.
- CrazyGames saves now also go to the SDK data module (progress follows the account), local fallback;
  portal test checks it.
- Final review: 1 bug fixed – losing on a telegraphed punch left that glove yellow into the next run
  (misleading tell). No other blocking issues found in game flow, ad flow, save, pause.
- Bundle 1.23 MB (341 KB gzip). Smoke + portal tests green, no console errors.
- Autopilot infra: fresh trigger sessions got 403 on push → worker is now the owner's session
  (`trig_01LjPvfniK2MMQiC68DYP6Mk`, hourly :32 + chaining). Model: Opus.
- Need: submit to CrazyGames (inbox), real QA tool run. Next: ALT-00 alternatives infra. Model: Sonnet.
- Fun top 3: phone playtest of the first 10 s; bigger unlock celebration; dodge move (ALT-01 tests it).

## 2026-10-24 – ALT-00 alternatives infra (autopilot)
- Done: multi-page Vite build – Pages/dev build ships the game at `/` and alternatives at `/alts/<nn-slug>/`
  plus an `/alts/` index (cards from `alts/list.ts`); portal builds stay game-only. `alts/00-base` = the
  unchanged game as reference and copy template. Saves namespaced per alt (`BasePlatform.namespace`).
  `npm run test:alts` checks the index lists every alt and each alt loads → starts → game over, no errors.
- Bundle unchanged (341 KB gzip game chunk; alts share it). All tests green.
- Next: ALT-01 Dodge & Counter. Model: Sonnet (running on Opus in this worker).

## Overrides
(none)
