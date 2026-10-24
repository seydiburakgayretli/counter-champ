# How the autopilot works (for the owner)

## The idea in one sentence
An "agent" is just a model in a loop: **read state → pick a task → act with tools → check →
write state back**. Making it autonomous means replacing the human who starts each loop with
a timer, and replacing the human's memory with files.

## The 5 parts in this project
| Part | What it is here | Why it matters |
|---|---|---|
| **Trigger** | Scheduled task "Studio autopilot (hourly)" (`trig_01HVWMSwMnuoc3e1oYHetzRJ`), cron at :53 every hour, plus chaining | Something must start each run; the model never runs by itself |
| **Fresh worker** | Each fire creates a new, empty cloud session (own container), clones the repo | No memory of earlier runs → no drift, but it must re-read state |
| **Memory** | Git repo: `CLAUDE.md` (rules), `docs/AUTOPILOT.md` (unattended rules), `docs/STUDIO.md` (board + inbox), `docs/PROGRESS.md` (log) | Files are the only memory that survives between runs |
| **Guardrails** | Tests must be green to push, "never" list, 10-minute owner guard, time-box, WIP rules | An agent with no one watching must fail safely, not loudly |
| **Human-in-the-loop** | Owner inbox in STUDIO.md: Keep / Kill / Merge questions | The agent prepares decisions; the owner makes them |

## Timing: heartbeat + chaining
- **Heartbeat:** every hour at :53 a new run starts, no matter what. If the board has nothing
  unblocked, it stops in ~20 s (cheap).
- **Chaining:** a run that finished a task and sees more work fires the trigger itself as its
  last step → the next run starts immediately. So the work is continuous while there is work;
  the hourly heartbeat restarts the chain if a run crashed or hit the usage limit.
- Two runs can overlap (heartbeat + chain). The board's "in progress" mark prevents both from
  taking the same task; `git pull --rebase` before push avoids conflicts.
- Nothing "polls every 15 min". Runs are started only by the timer or by the previous run.

## Where to watch it
- **GitHub commits** on `main` tagged `[autopilot]`: real progress.
- **docs/PROGRESS.md** (what was done) and **docs/STUDIO.md** (board + your inbox).
- **Claude Code session list** (claude.ai/code or the app): each run shows up as its own session;
  open one to read exactly what it did.
- Pages links for the alternatives: `/alts/` index once ALT-00 is done.

## Limits to know
- The agent cannot see remaining quota; when the limit hits, runs fail until it resets.
- Runs use the account's default model (now Sonnet), not the model tag on the board.
- Anything outside the repo (portal accounts, submission, phone playtest) stays with the owner.
- To stop: tell Claude "dur" (task gets disabled) or disable the scheduled task yourself.
