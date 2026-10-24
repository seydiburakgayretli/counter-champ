# Plan

## M0 – Setup + concept
- [x] Vite + TS + Phaser 3 scaffold, build into /dist
- [x] Working docs (CLAUDE.md, GDD, PLAN, PROGRESS, IDEAS, PORTAL_CHECKLIST)
- [x] 3 concepts scored, recommendation in GDD draft
- [x] Owner picks a concept → GDD finalized
Acceptance: build passes; owner has chosen a concept.

## M1 – Grey-box core loop
Model: Sonnet
- [x] Core loop with placeholder shapes; touch, mouse, keyboard
- [x] Score, hearts, game over, instant restart (< 1 s)
- [x] `gameplayStart` on first input, `gameplayStop` on game over (local adapter logs)
- [x] Playwright smoke test (load → input → game over)
- [x] GitHub Pages auto-deploy of the dev build; link shared
Acceptance (owner): owner plays 5 runs on phone and wants a 6th.

## M2 – Game feel, art, audio
Model: Sonnet
- [x] Hit-stop, screen shake, particles, score pop-ups (pooled)
- [x] Procedural vector art for player gloves, opponents, ring
- [x] Generated WebAudio SFX + mute toggle (speaker icon / M key, saved via adapter)
Acceptance: 60 fps on mid-range phone; impacts feel punchy; no console errors.

## M3 – Progression
Model: Opus (curve tuning), then Sonnet
- [x] Best score + best opponent always visible
- [x] Cosmetic unlocks (gloves, ring; shorts dropped – player is only gloves)
- [x] Tuned difficulty curve (new player ~45 s, good player ~2 min)
- [x] Save/load through the adapter
Acceptance: progress survives reload; unlock reached in first 3 runs.

## M4 – Portal adapter + ads
Model: Sonnet
- [x] local (1 s fake ad overlay), crazygames, poki implementations (check current SDK docs)
- [x] Interstitial every 3rd KO / at game over (rate-limited), rewarded continue once
- [x] Event order verified (no double start/stop)
Acceptance: each build mode runs in its portal QA tool / local harness without errors.

## M5 – Responsive, performance, size
Model: Sonnet
- [x] Portrait + landscape layouts, resize live, no scroll
- [x] Pooling audit, no per-frame allocations, 60 fps (60 fps on a real phone: owner check)
- [x] Bundle size report, < 5 MB
Acceptance: works on phone (both orientations) and desktop; size within budget.

## M6 – Release kit
Model: Opus (final pre-release review)
- [x] Production zip per portal, PORTAL_CHECKLIST all green (except owner-only QA tool run)
- [x] Cover/icon images per portal spec, description, tags
- [x] Step-by-step submission notes for the owner (docs/RELEASE.md)
Acceptance: owner can submit without asking questions.
