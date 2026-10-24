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
