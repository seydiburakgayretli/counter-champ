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
