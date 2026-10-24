// ALT-10 No-Engine: the core loop in plain Canvas2D + TypeScript, no Phaser. Same tuning, rivals, platform
// adapter and SFX as the main game; art is simplified. Purpose: compare size, load time and fps.
import { BasePlatform } from '../../src/platform/BasePlatform';
import { platform } from '../../src/platform';
import { Sfx } from '../../src/game/Sfx';
import { GRACE_MS, HEAL_EVERY, MAX_HEARTS, rivalFor, tuning, type Tuning } from '../../src/game/tuning';

BasePlatform.namespace = 'cc.alt10.';

type State = 'title' | 'idle' | 'threat' | 'ko' | 'over' | 'paused' | 'ad';
interface Popup { text: string; color: string; x: number; y: number; age: number; life: number }

const INK = '#14141f';
const FONT = 'system-ui, sans-serif';
const ROPES = ['#e63946', '#f5f5f5', '#4d7cff'];
const SIDES = [-1, 1] as const;
const RETRY_LOCK_MS = 350;
const KO_MS = 1300;

const host = document.getElementById('game') as HTMLElement;
const canvas = document.createElement('canvas');
host.appendChild(canvas);
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const sfx = new Sfx();
const pops: Popup[] = Array.from({ length: 6 }, () => ({ text: '', color: '', x: 0, y: 0, age: 0, life: 0 }));
let popNext = 0;

const S = {
  state: 'title' as State, paused: 'idle' as State, t: 0, runStart: 0, level: 0, tn: tuning(0) as Tuning,
  score: 0, best: Number(platform.load('best')) || 0, hearts: MAX_HEARTS, combo: 0, ko: 0,
  side: 1 as -1 | 1, feint: false, startT: 0, impactAt: 0, timer: 0, koT: 0, overAt: 0, freeze: 0,
  shake: 0, flash: 0, hurtT: -9999, tap: [999, 999], continued: false,
};
const dbg = { state: 'title' as State, score: 0, hearts: MAX_HEARTS, level: 0, msToImpact: 9999, threatSide: 0, feint: false };
(window as unknown as { __cc: typeof dbg }).__cc = dbg;

let W = 0, H = 0, U = 40;
function resize(): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  U = Math.min(W, H * 0.62) / 10;
}
window.addEventListener('resize', resize);
resize();

function pop(text: string, color: string, x: number, y: number): void {
  const p = pops[popNext];
  popNext = (popNext + 1) % pops.length;
  p.text = text; p.color = color; p.x = x; p.y = y; p.age = 0; p.life = 800;
}

function rand(a: number, b: number): number { return a + Math.random() * (b - a); }

function beginIdle(): void {
  S.state = 'idle';
  S.timer = S.t + rand(S.tn.idleMinMs, S.tn.idleMaxMs);
}

function startRun(): void {
  Object.assign(S, { score: 0, hearts: MAX_HEARTS, combo: 0, ko: 0, level: 0, tn: tuning(0), runStart: S.t, continued: false });
  sfx.start();
  beginIdle();
  platform.gameplayStart();
}

function gameOver(): void {
  S.state = 'over';
  S.overAt = S.t;
  sfx.gameOver();
  platform.gameplayStop();
  if (S.score > S.best) { S.best = S.score; platform.save('best', String(S.best)); }
}

function miss(text: string): void {
  S.combo = 0;
  S.ko = Math.max(0, S.ko - 0.15);
  pop(text, '#ff5a5a', W / 2, H * 0.2);
  S.flash = 0.35; S.shake = 140; S.freeze = 70;
  sfx.hit();
  const prot = S.hearts === 1 && S.t - S.runStart < GRACE_MS;
  if (!prot) S.hearts--;
  if (S.hearts <= 0) gameOver();
  else beginIdle();
}

function judge(side: -1 | 0 | 1): void {
  if (side !== 0) S.tap[side === -1 ? 0 : 1] = 0;
  if (S.feint) { S.combo = 0; S.score = Math.max(0, S.score - 50); pop('FEINT!', '#ff9f1c', W / 2, H * 0.2); sfx.feint(); return beginIdle(); }
  if (side !== 0 && side !== S.side) return miss('WRONG SIDE');
  const dt = S.t - S.impactAt;
  if (dt < -S.tn.goodMs) return miss('TOO EARLY');
  if (Math.abs(dt) <= S.tn.perfectMs) {
    S.combo++;
    S.score += 100 * S.combo;
    S.ko += S.tn.koPerfect;
    pop(S.combo > 1 ? `PERFECT x${S.combo}` : 'PERFECT!', '#ffd23f', W / 2, H * 0.2);
    sfx.counter(S.combo);
    S.freeze = 70; S.shake = 90; S.hurtT = S.t;
  } else {
    S.combo = 0; S.score += 20; S.ko += S.tn.koPerfect * 0.35;
    pop('BLOCK', '#8ecae6', W / 2, H * 0.2);
    sfx.block();
  }
  if (S.ko >= 0.999) {
    S.state = 'ko'; S.koT = 0; S.score += 500; S.ko = 1; S.freeze = 180; S.shake = 260;
    pop('KNOCKOUT!', '#ffd23f', W / 2, H * 0.2);
    sfx.knockout();
    if ((S.level + 1) % HEAL_EVERY === 0 && S.hearts < MAX_HEARTS) S.hearts++;
  } else beginIdle();
}

async function onInput(side: -1 | 0 | 1): Promise<void> {
  sfx.unlock();
  switch (S.state) {
    case 'title': return startRun();
    case 'paused': S.state = S.paused; platform.gameplayStart(); return;
    case 'threat': return judge(side);
    case 'over':
      if (S.t - S.overAt < RETRY_LOCK_MS) return;
      S.state = 'ad';
      await platform.commercialBreak();
      return startRun();
    default: return;
  }
}

canvas.addEventListener('pointerdown', (e) => { void onInput(e.clientX < W / 2 ? -1 : 1); });
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'KeyM') { sfx.unlock(); sfx.setMuted(!sfx.muted); return; }
  const side = e.code === 'ArrowLeft' || e.code === 'KeyA' ? -1 : e.code === 'ArrowRight' || e.code === 'KeyD' ? 1 : e.code === 'Space' ? 0 : null;
  if (side === null) return;
  e.preventDefault();
  void onInput(side);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (S.state === 'idle' || S.state === 'threat' || S.state === 'ko')) { S.paused = S.state; S.state = 'paused'; platform.gameplayStop(); }
});

function step(dt: number): void {
  S.t += dt;
  S.tap[0] += dt; S.tap[1] += dt;
  if (S.state === 'idle' && S.t >= S.timer) {
    S.state = 'threat';
    S.side = Math.random() < 0.5 ? -1 : 1;
    S.feint = Math.random() < S.tn.feintChance;
    S.startT = S.t;
    S.impactAt = S.t + S.tn.windupMs;
    sfx.whoosh();
  } else if (S.state === 'threat') {
    if (!S.feint && S.t > S.impactAt + S.tn.goodMs) miss('TOO LATE');
    else if (S.feint && S.t > S.impactAt) beginIdle();
  } else if (S.state === 'ko') {
    S.koT += dt;
    if (S.koT >= KO_MS) { S.level++; S.tn = tuning(S.level); S.ko = 0; beginIdle(); }
  }
}

function circle(x: number, y: number, r: number, fill: string, stroke = true): void {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
}

function text(s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center'): void {
  ctx.font = `800 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeText(s, x, y); ctx.fillStyle = color; ctx.fillText(s, x, y);
}

function hex(c: number): string { return `#${c.toString(16).padStart(6, '0')}`; }

function render(): void {
  const cx = W / 2, cy = H * 0.36, u = U;
  ctx.save();
  if (S.shake > 0) ctx.translate((Math.random() - 0.5) * u * 0.3, (Math.random() - 0.5) * u * 0.3);
  ctx.fillStyle = '#2a2d45'; ctx.fillRect(-u, -u, W + 2 * u, H + 2 * u);
  ctx.fillStyle = '#3b2f5c'; ctx.fillRect(-u, H * 0.5, W + 2 * u, H * 0.5 + u);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = ROPES[i]; ctx.fillRect(0, H * (0.3 + i * 0.075), W, Math.max(3, H * 0.006)); }
  const rv = rivalFor(S.level);
  const fall = S.state === 'ko' ? Math.min(1, S.koT / 700) : 0;
  const oy = u * 5 * fall * fall + (S.state === 'idle' || S.state === 'threat' || S.state === 'title' ? Math.sin(S.t / 260) * u * 0.12 : 0);
  // body + head
  ctx.fillStyle = hex(rv.color); ctx.lineWidth = 4; ctx.strokeStyle = INK;
  const bw = u * 5 * rv.wide;
  ctx.beginPath(); ctx.roundRect(cx - bw / 2, cy + u * 1.5 + oy, bw, u * 2.6, u * 0.6); ctx.fill(); ctx.stroke();
  circle(cx, cy - u * 0.9 + oy, u * 1.5, '#f1c27d');
  const hurt = S.state === 'ko' || S.t - S.hurtT < 380;
  text(hurt ? 'x  x' : '•  •', cx, cy - u * 1 + oy, u * 0.9, INK);
  // opponent gloves + telegraph ring
  for (const s of SIDES) {
    let gx = cx + s * u * 3, gy = cy + u + oy, hot = false;
    if (S.state === 'threat' && S.side === s) {
      const p = Math.min(1, (S.t - S.startT) / S.tn.windupMs);
      const q = S.feint && p >= 0.55 ? 0 : 1 - (1 - p) * (1 - p);
      gx += s * u * 0.9 * q; gy -= u * 1.2 * q; hot = !(S.feint && p >= 0.55);
      if (hot) {
        const d = Math.abs(S.t - S.impactAt);
        ctx.beginPath(); ctx.arc(gx, gy, u * 1.1 * (1 + 2.6 * (1 - p)), 0, Math.PI * 2);
        ctx.lineWidth = 5; ctx.strokeStyle = d <= S.tn.perfectMs ? '#ffd23f' : d <= S.tn.goodMs ? '#ffffff' : '#9aa0b5'; ctx.stroke();
      }
    }
    circle(gx, gy, u * 1.1, hot ? '#ffd23f' : '#f5f5f5');
  }
  // player gloves
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1, k = S.tap[i] < 160 ? 1 - S.tap[i] / 160 : 0;
    circle(cx + s * u * 3.2 - s * u * k * 0.8, H - u * 1.7 - u * 2.2 * k, u * 1.4 * (1 + 0.25 * k), '#e63946');
  }
  ctx.restore();
  // HUD
  const fs = Math.max(14, Math.round(u * 0.8)), pad = u * 0.5;
  text(`${S.score}`, pad, pad + fs / 2, fs, '#fff', 'left');
  text(`BEST ${Math.max(S.best, S.score)}`, W - pad, pad + fs / 2, Math.round(fs * 0.7), '#fff', 'right');
  for (let i = 0; i < MAX_HEARTS; i++) circle(pad + u * 0.4 + i * u * 1.1, pad + fs * 2.4, u * 0.4, i < S.hearts ? '#e63946' : '#3a3a4a');
  const bx = pad + MAX_HEARTS * u * 1.1 + u * 0.3, bwid = W - pad - u * 0.5 - bx;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, pad + fs * 2.4 - u * 0.25, bwid, u * 0.5);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx, pad + fs * 2.4 - u * 0.25, bwid * Math.min(1, S.ko), u * 0.5);
  text(`#${S.level + 1} ${rv.name.toUpperCase()}`, cx, cy + u * 4.5, Math.round(fs * 0.75), '#fff');
  if (S.combo > 1) text(`COMBO x${S.combo}`, cx, H * 0.58, Math.round(fs * 1.6), '#ffd23f');
  for (const p of pops) if (p.age < p.life) text(p.text, p.x, p.y - u * (p.age / p.life), fs * 1.4, p.color);
  if (S.flash > 0) { ctx.fillStyle = `rgba(255,45,45,${S.flash})`; ctx.fillRect(0, 0, W, H); }
  const msg = S.state === 'title' ? `COUNTER CHAMP|NO ENGINE||TAP TO FIGHT|Best ${S.best}`
    : S.state === 'over' ? `KNOCKED OUT||Score ${S.score}|Best ${S.best}||TAP TO RETRY`
      : S.state === 'paused' ? 'PAUSED||TAP TO RESUME' : '';
  if (msg) {
    if (S.state !== 'title') { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H); }
    const ms = Math.round(Math.min(fs * 1.3, W / 11));
    msg.split('|').forEach((l, i, a) => text(l, cx, H * 0.53 + (i - (a.length - 1) / 2) * ms * 1.3, ms, '#fff'));
  }
  dbg.state = S.state; dbg.score = S.score; dbg.hearts = S.hearts; dbg.level = S.level;
  dbg.msToImpact = S.state === 'threat' ? S.impactAt - S.t : 9999;
  dbg.threatSide = S.state === 'threat' ? S.side : 0;
  dbg.feint = S.feint && S.state === 'threat';
}

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(50, now - last);
  last = now;
  if (S.state !== 'paused' && S.state !== 'ad') {
    for (const p of pops) if (p.age < p.life) p.age += dt;
    if (S.freeze > 0) S.freeze -= dt;
    else step(dt);
  }
  S.shake = Math.max(0, S.shake - dt);
  S.flash = Math.max(0, S.flash - dt / 400);
  render();
  requestAnimationFrame(frame);
}

platform.loadingStart();
void platform.init().then(() => {
  document.getElementById('loading')?.remove();
  platform.loadingFinished();
  requestAnimationFrame(frame);
});
