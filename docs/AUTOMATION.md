# How the autopilot works (for the owner)

## The idea in one sentence
An "agent" is just a model in a loop: **read state → pick a task → act with tools → check →
write state back**. Making it autonomous means replacing the human who starts each loop with
a timer, and replacing the human's memory with files.

## The 5 parts in this project
| Part | What it is here | Why it matters |
|---|---|---|
| **Trigger** | Scheduled task "Studio autopilot (hourly, this session)" (`trig_01LjPvfniK2MMQiC68DYP6Mk`), cron at :32 every hour, plus chaining | Something must start each run; the model never runs by itself |
| **Worker** | One long-lived session (the one the owner set this up in) receives each fire. Fresh sessions per fire were tried first: they could clone but got 403 on push | The worker must have push rights; it still re-reads the docs each run instead of trusting chat memory |
| **Memory** | Git repo: `CLAUDE.md` (rules), `docs/AUTOPILOT.md` (unattended rules), `docs/STUDIO.md` (board + inbox), `docs/PROGRESS.md` (log) | Files are the only memory that survives between runs |
| **Guardrails** | Tests must be green to push, "never" list, 10-minute owner guard, time-box, WIP rules | An agent with no one watching must fail safely, not loudly |
| **Human-in-the-loop** | Owner inbox in STUDIO.md: Keep / Kill / Merge questions | The agent prepares decisions; the owner makes them |

## Timing: heartbeat + chaining
- **Heartbeat:** every hour at :32 (Amsterdam time too) a new run starts, no matter what. If the board has nothing
  unblocked, it stops in ~20 s (cheap).
- **Chaining:** a run that finished a task and sees more work fires the trigger itself as its
  last step → the next run starts immediately. So the work is continuous while there is work;
  the hourly heartbeat restarts the chain if a run crashed or hit the usage limit.
- Fires that arrive while a run is busy wait until its turn ends (one worker → no overlap).
- Nothing "polls every 15 min". Runs are started only by the timer or by the previous run.

## Where to watch it
- **GitHub commits** on `main` tagged `[autopilot]`: real progress.
- **docs/PROGRESS.md** (what was done) and **docs/STUDIO.md** (board + your inbox).
- **This chat** in the Claude app: each run appears here as a new turn with a one-line note.
- Pages links for the alternatives: `/alts/` index once ALT-00 is done.

## Limits to know
- The agent cannot see remaining quota; when the limit hits, runs fail until it resets.
- Runs use the worker session's model (now Opus), not the model tag on the board.
- Anything outside the repo (portal accounts, submission, phone playtest) stays with the owner.
- To stop: tell Claude "dur" (task gets disabled) or disable the scheduled task yourself.
