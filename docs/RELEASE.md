# Release kit – Counter Champ

## Files
- Build: `npm run release` → `release/counter-champ-{crazygames,poki}.zip`; ready copies are committed in
  `release-assets/` (download from GitHub: open the file → "Download raw file")
  (index.html at the zip root, relative paths, ~350 KB zipped).
- Covers (in git): `release-assets/covers/` – landscape 1920x1080, portrait 800x1200, square 800x800,
  icon 512x512. Re-render: `npm run build && npm run covers`. Sizes are from memory: check the
  upload form; if it asks for other sizes, change `SIZES` in `scripts/covers.cjs`.

## Store text
- **Title:** Counter Champ
- **Short description (1 line):** Time your counter-punch and knock out a gauntlet of cartoon boxers!
- **Description:** Read the wind-up, wait for the golden ring, and counter at the perfect moment.
  Chain perfect counters for combos, dodge the fakes, and knock out 8 rivals with their own tricks.
  Unlock new gloves and rings as you climb. One tap to play, quick runs, beat your best.
- **Controls:** Tap the left or right half of the screen · Keyboard: ← / → (or A / D), Space · M = mute
- **Tags / category:** Boxing, Fighting, Timing, Reflex, One Button, Arcade, Casual, Sports
- **Age:** cartoon impacts, no blood (PEGI 12 safe; likely "7+" at portals)

## CrazyGames submission (owner, ~15 min)
1. Developer account: developer.crazygames.com (sign in, fill payout later).
2. "Upload new game" → HTML5 → upload `release-assets/counter-champ-crazygames.zip`.
3. Fill title, description, controls, tags from above; upload the 3 covers.
4. Orientation: both; mobile: yes.
5. Open the preview / QA tool: play 2 runs, take one "continue" (rewarded) and one retry after a game
   over (midgame ad every 2nd retry, max once a minute). Check: no console errors, sound mutes
   during ads, progress survives reload.
6. Submit. Expect QA feedback in ~1–2 days, then a limited "basic launch" test (~2 weeks).
7. Paste any QA feedback into the STUDIO.md inbox; the autopilot fixes it.

## Poki (later)
Poki is curated: apply with the Pages link at developers.poki.com. Build `counter-champ-poki.zip`
is ready for when they accept; check it in the Poki Inspector first.

## Not verifiable from Claude's container
Real SDK behaviour (calls are written from the SDK docs as remembered, tested only against mocks),
real-device fps and audio, exact cover specs. All three are covered by step 5 above.
