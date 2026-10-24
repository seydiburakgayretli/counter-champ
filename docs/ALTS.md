# Counter Champ alternatives

Play: https://seydiburakgayretli.github.io/counter-champ/alts/ (one card per alternative).

## How an alt is built (for the autopilot)
- Copy `alts/00-base/` to `alts/<nn-slug>/`, set `BasePlatform.namespace = 'cc.alt<nn>.'`.
- Mechanics/art changes: copy the files you change (e.g. `src/scenes/GameScene.ts`, `src/game/art.ts`)
  into the alt folder and edit the copies; import everything else from `src/`. Never edit `src/` for an alt.
- Keep the test contract: `window.__cc.state` = 'title' → (first input) → … → 'over'.
- Add the card to `alts/list.ts`, run `npm run build && npm run test:alts <nn-slug>`.
- Portal builds (`--mode crazygames|poki`) never include alts.

## Results (5 lines per alt: hypothesis · what changed · size · cost to merge · risk)

### ALT-01 Dodge & Counter – `/alts/01-dodge/` (ready, 2026-10-24)
- **Hypothesis:** a second move adds depth and "outplay" moments without breaking one-thumb control.
- **What changed:** 20 % of single punches are heavy (red glove + red ring, +5 %/rival, max 40 %).
  Tapping the punch side = hit ("CAN'T BLOCK – SLIP!"); tapping the other side (or Space) slips it.
  Perfect slip opens a 700 ms punish window: any tap = PUNISH, combo +2, 200×combo points, double KO damage.
- **Size:** +19 KB raw (6.8 KB gzip) on top of the shared game chunk.
- **Cost to merge:** small (~1 run): flag + 2 methods in GameScene, glove colour param in art.ts; tuning sim rerun.
- **Risk:** "tap the opposite side" may feel backwards for the first heavy; red vs. yellow must read on
  small phones. Scripted perfect player: reached rival 3 with full hearts, punish fired correctly.

### ALT-02 Rhythm Fighter – `/alts/02-rhythm/` (ready, 2026-10-24)
- **Hypothesis:** a beat makes timing learnable by ear → more "flow", longer sessions, more replays.
- **What changed:** generated music loop (kick, off-beat hat, 4-bar bass), 96 BPM +8 per rival (max 160).
  Every wind-up starts and every impact lands on the eighth-note grid; screen pulses on beats.
  Perfect = "ON BEAT", 150×combo (was 100). Hit-stop removed so the beat never stutters (shake stays).
- **Size:** +18 KB raw (6.4 KB gzip) on top of the shared game chunk.
- **Cost to merge:** medium (~1–2 runs): grid scheduling in GameScene, music in Sfx, re-tune curve
  (wind-ups now snap to eighths), decide hit-stop vs. beat.
- **Risk:** needs sound to shine (many portal players are muted at first); losing hit-stop costs some
  punch. Not heard by Claude (no audio device) – owner must listen. Scripted player: rival 3, full hearts.

### ALT-03 Boss Rush – `/alts/03-boss/` (ready, 2026-10-24)
- **Hypothesis:** a clear goal ("beat the Champ") + best time drives mastery replays better than endless.
- **What changed:** one opponent (The Champ), 3 phases: phase 1 = rival-2 speed, phase 2 adds feints and
  doubles (rival-4 tells), phase 3 = rival-7 speed. Filling the bar = stagger + "PHASE n!" + 1 heart back.
  Final KO = win screen with time; best time saved and shown on title/HUD. Loss screen shows phase + bar %.
- **Size:** ~+18 KB raw (~6 KB gzip) on top of the shared game chunk.
- **Cost to merge:** medium: works best as a second mode next to endless (mode select = new UI) or as
  "boss every 3rd rival" in the endless run (~1 run).
- **Risk:** a run that is won ends the session's goal → fewer replays once beaten; needs a harder boss
  ladder later. Scripted perfect player: won in 59 s with full hearts → real players ~80–120 s.

### ALT-04 Four-Way Brawl – `/alts/04-brawl/` (ready, 2026-10-24)
- **Hypothesis:** more simultaneous threats = more chaos and juice per second → stronger first 10 s.
- **What changed:** new top-down scene: you in the centre with 4 fists; small brawlers rush in from
  up/right/down/left with shrinking rings; tap that quadrant (screen split by the faint X) or arrows/WASD
  at arrival. Perfect = POW (100×combo, capped ×10), early tap = MISS (combo lost), late = hit.
  Pace ramps over 90 s (spawn gap 1100→420 ms, travel 1300→650 ms). 3 hearts, best score, retry ad.
- **Size:** +9 KB raw (3.7 KB gzip) – own scene, reuses Fx/Sfx/Glove/platform.
- **Cost to merge:** large – a different game, not a feature; would ship as its own title.
- **Risk:** 4 directions on a phone = thumb travel and mis-taps on quadrant borders; loses the boxing
  "read the opponent" identity. Scripted perfect player survives 45 s+ (bots don't tire; humans will).

### ALT-05 Glove Shop – `/alts/05-shop/` (ready, 2026-10-24)
- **Hypothesis:** a visible "spend coins → get stronger" loop raises runs per session and return visits.
- **What changed:** coins per run (score/40 + 10 per KO, ~30–40 for a first run). Shop on title and game
  over (tap a button or keys 1/2/3): +1 heart (60/180), wider timing +12 %/level (40/100/220), combo
  shield = first hit per run costs no heart (120). Saved per player. Game over text made compact.
- **Size:** ~+20 KB raw (~7 KB gzip) on top of the shared game chunk.
- **Cost to merge:** small–medium (~1 run): shop panel + save; needs prices re-tuned with the real curve.
- **Risk:** upgrades make the game easier over time → score comparisons less fair; the shop panel takes
  screen space at game over (restart still 1 tap). First purchase reachable after run 1–2 (scripted test).
