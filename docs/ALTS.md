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

### ALT-06 Pixel Retro – `/alts/06-pixel/` (ready, 2026-10-24)
- **Hypothesis:** a retro 8-bit look stands out in portal grids and fits the "Punch-Out" boxing memory.
- **What changed:** the same vector game rendered at 1/3 resolution and zoomed ×3 with hard pixels
  (Phaser zoom + pixelArt), thinner outlines, monospace font, square-wave "chiptune" SFX. Gameplay identical.
- **Size:** ~+23 KB raw (~8 KB gzip; copies of scene/art/Fx/Sfx).
- **Cost to merge:** small as a skin (zoom + art constants), but it replaces the current style – one art
  style per game (market rule), so it is either/or.
- **Risk:** small HUD text gets hard to read in landscape; pixel font is the system monospace (no custom
  font asset). Pointer + keyboard input verified through the zoom in portrait and landscape.

### ALT-07 Neon Night – `/alts/07-neon/` (ready, 2026-10-24)
- **Hypothesis:** a synthwave look reads "cool/modern" in thumbnails and suits a dark-mode portal grid.
- **What changed:** dark fills + neon outlines in each rival's colour, cyan/magenta ropes, sunset sun and
  perspective grid floor; glow faked with a wide faint stroke under a thin bright one. Gameplay identical.
- **Size:** ~+19 KB raw (~6.6 KB gzip).
- **Cost to merge:** small as a skin (art.ts + scene colours), but either/or with the current style.
- **Risk:** Phaser's real glow shader (postFX) was tried and dropped – it froze the software renderer and
  would hurt weak phones. Even without it, the full-screen grid costs frame time headless (50 vs 33 ms);
  check fps on a phone before choosing this.

### ALT-08 Doodle Paper – `/alts/08-doodle/` (ready, 2026-10-24)
- **Hypothesis:** a hand-drawn notebook look is friendly, unusual on portals and reads well in light mode.
- **What changed:** paper background with ruled lines and red margin, pencil ropes, opponent redrawn as
  wobbly double-stroked sketch shapes with a "line boil" (new wobble ~8×/s), dark ink text on paper,
  handwriting font stack (Comic Sans / Marker Felt / Chalkboard, falls back to serif). Gameplay identical.
- **Size:** ~+18 KB raw (~6.7 KB gzip).
- **Cost to merge:** small as a skin, either/or with the current style.
- **Risk:** the boil redraws the fighter Graphics 8×/s (small CPU cost); font differs per device (no font
  asset; the container fell back to serif). Yellow-on-paper contrast fixed for combo text.

### ALT-09 Animal Boxers – `/alts/09-animals/` (ready, 2026-10-24)
- **Hypothesis:** cute animal characters make better thumbnails and stronger click-through than humans,
  and a visible "tell" face teaches timing without text.
- **What changed:** 8 animals replace the human rivals (Bruno the Bear, Mittens, Doodle Doo, Hoppy, Hamhock,
  Thumper, Billy, King Leo with mane + crown), each with its own ears/beak/snout. While winding up, the
  animal squints and opens its mouth (the tell); hit = X-eyes + tongue. Same difficulty order.
- **Size:** ~+21 KB raw (~7 KB gzip).
- **Cost to merge:** small (~1 run): swap drawFighter + rival list; the tell face can also be added to the
  human cast on its own.
- **Risk:** tell face could make reading too easy (watch scores); names must stay brand/person-free
  (renamed the rooster away from a real-person pun).

### ALT-10 No-Engine – `/alts/10-noengine/` (ready, 2026-10-24)
- **Hypothesis:** dropping Phaser makes the game load near-instantly (better first 10 s, Poki likes tiny).
- **What changed:** the core loop (same tuning, rivals, hearts, KO bar, feints, combo, hit-stop, shake,
  pop-ups, platform adapter, SFX) rewritten in ~300 lines of plain Canvas2D + TS. Art simplified (circles,
  boxes, text eyes); no doubles, unlocks or rewarded continue.
- **Size:** page total 6 KB gzip vs 341 KB for the Phaser game (~55× smaller).
  Measured headless on throttled "slow 4G": ready in 0.4 s vs 2.7 s; median frame 16.7 ms vs 33.4 ms.
- **Cost to merge:** large – a full port of art (Graphics → Canvas paths), Fx, unlocks, ads flow
  (~3–4 runs), but every later game would start from a 6 KB base.
- **Risk:** we own everything Phaser gave us (scaling, input edge cases, text rendering); art redraw in
  plain canvas is more work per style.

## Claude's pick (for the owner's decision, 2026-10-24)
Biggest money levers, in order: **ALT-09 animals** (thumbnail/click-through, the tell face also helps
new players) → **ALT-01 dodge** (depth for retention, cheap to merge) → **ALT-05 shop** (return visits).
Art style: keep one; animals fit the current clean style. **ALT-10** is the best long-term base (load
speed) but a rewrite – do it only if Poki says yes or load time shows up in portal stats.
Probably kill: ALT-04 (different game), ALT-02 (needs sound, many players muted).
