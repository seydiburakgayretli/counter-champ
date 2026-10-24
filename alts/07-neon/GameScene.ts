import Phaser from 'phaser';
import { platform } from '../../src/platform';
import { Glove, INK, drawArena, drawFighter, drawSpeaker, type Face } from './art';
import { Particles, Popups, TEXT_RES } from '../../src/game/Fx';
import { Sfx } from '../../src/game/Sfx';
import { GRACE_MS, HEAL_EVERY, MAX_HEARTS, rivalFor, tuning, type Tuning } from '../../src/game/tuning';
import { FLOORS, GLOVES, nextGoal, topUnlocked } from '../../src/game/unlocks';

type State = 'title' | 'idle' | 'threat' | 'gap' | 'ko' | 'over' | 'paused' | 'ad';
type Side = -1 | 1;
type Fx = 'none' | 'hit' | 'block' | 'counter';
type MissReason = 'early' | 'late' | 'wrong';

interface Threat {
  side: Side;
  feint: boolean;
  windupMs: number;
}

/** Read-only snapshot for the Playwright smoke test (mutated in place, never reallocated). */
interface DebugState {
  state: State;
  score: number;
  hearts: number;
  level: number;
  msToImpact: number;
  threatSide: number;
  feint: boolean;
  glove: number;
}

const FONT = 'system-ui, sans-serif';
const GAP_MS = 300;
const RETRY_LOCK_MS = 350;
/** Interstitial before a retry: every 2nd run, and at most once per minute. */
const AD_EVERY_RUNS = 2;
const AD_COOLDOWN_MS = 60000;
const KO_FALL_MS = 800;
const KO_TOTAL_MS = 1500;
const KO_BLOCK_SHARE = 0.35;
const KO_HIT_LOSS = 0.15;
const STOP_COUNTER_MS = 70;
const STOP_KO_MS = 180;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (v: number): number => 1 - (1 - v) * (1 - v);
const rand = (min: number, max: number): number => min + Math.random() * (max - min);

export class GameScene extends Phaser.Scene {
  // run state
  private state: State = 'title';
  private pausedFrom: State = 'idle';
  private t = 0;
  private wall = 0;
  private runStart = 0;
  private level = 0;
  private tn: Tuning = tuning(0);
  private score = 0;
  private best = 0;
  private bestRival = 0;
  /** Most rivals knocked out in one run (drives glove unlocks). */
  private bestKos = 0;
  private gloveIdx = 0;
  private floorIdx = 0;
  private hearts = MAX_HEARTS;
  private combo = 0;
  private ko = 0;
  private newBest = false;
  private continued = false;
  private runsSinceAd = 0;
  private lastAdAt = performance.now();

  // threat state
  private readonly seq: Threat[] = [
    { side: -1, feint: false, windupMs: 0 },
    { side: 1, feint: false, windupMs: 0 },
  ];
  private seqLen = 1;
  private seqIdx = 0;
  private startT = 0;
  private impactAt = 0;
  private timer = 0;

  // animation state
  private fx: Fx = 'none';
  private fxT = 999;
  private fxSide: Side = 1;
  private koT = 0;
  private koSwapped = false;
  private freeze = 0;
  private face: Face = 'normal';
  private faceT = 0;
  private oppOffX = 0;
  private oppOffY = 0;
  private overAt = 0;
  private readonly tapT: [number, number] = [999, 999];
  private ringColor = 0;

  // layout
  private u = 40;
  private cx = 0;
  private cy = 0;
  private barW = 0;

  // display objects
  private bg!: Phaser.GameObjects.Rectangle;
  private floor!: Phaser.GameObjects.Rectangle;
  private arena!: Phaser.GameObjects.Graphics;
  private divider!: Phaser.GameObjects.Rectangle;
  private fighter!: Phaser.GameObjects.Graphics;
  private oppGloves!: [Glove, Glove];
  private myGloves!: [Glove, Glove];
  private particles!: Particles;
  private popups!: Popups;
  private muteBtn!: Phaser.GameObjects.Graphics;
  private readonly sfx = new Sfx();
  private ring!: Phaser.GameObjects.Arc;
  private flash!: Phaser.GameObjects.Rectangle;
  private dim!: Phaser.GameObjects.Rectangle;
  private koBg!: Phaser.GameObjects.Rectangle;
  private koFill!: Phaser.GameObjects.Rectangle;
  private heartIcons: Phaser.GameObjects.Arc[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private rivalText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private msgText!: Phaser.GameObjects.Text;
  private shownScore = -1;
  private shownCombo = -1;

  private readonly dbg: DebugState = {
    state: 'title', score: 0, hearts: MAX_HEARTS, level: 0, msToImpact: 9999, threatSide: 0, feint: false, glove: 0,
  };

  constructor() {
    super('Game');
  }

  create(): void {
    this.loadSave();
    this.sfx.muted = platform.load('mute') === '1';
    this.bg = this.add.rectangle(0, 0, 10, 10, 0x0b0820);
    this.floor = this.add.rectangle(0, 0, 10, 10, 0x3b2f5c, 0);
    this.divider = this.add.rectangle(0, 0, 4, 10, 0xffffff, 0.07);
    this.arena = this.add.graphics();
    this.fighter = this.add.graphics();
    this.oppGloves = [new Glove(this, 0xf5f5f5, -1), new Glove(this, 0xf5f5f5, 1)];
    this.ring = this.add.circle(0, 0, 10).setFillStyle().setStrokeStyle(5, 0xffffff).setVisible(false);
    this.myGloves = [new Glove(this, 0xe63946, -1), new Glove(this, 0xe63946, 1)];
    this.particles = new Particles(this);
    this.popups = new Popups(this);
    this.muteBtn = this.add.graphics();
    this.flash = this.add.rectangle(0, 0, 10, 10, 0xff2d2d, 0);
    this.koBg = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.45).setOrigin(0, 0.5);
    this.koFill = this.add.rectangle(0, 0, 10, 10, 0xffd23f).setOrigin(0, 0.5);
    for (let i = 0; i < MAX_HEARTS; i++) this.heartIcons.push(this.add.circle(0, 0, 10, 0xe63946).setStrokeStyle(3, INK));
    this.dim = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.6).setVisible(false);

    const txt = (ox: number, oy: number): Phaser.GameObjects.Text =>
      this.add.text(0, 0, '', { fontFamily: FONT, fontStyle: '800', color: '#ffffff', stroke: '#ff2fd0', strokeThickness: 5, align: 'center', resolution: TEXT_RES })
        .setOrigin(ox, oy);
    this.scoreText = txt(0, 0).setColor('#2ff3ff');
    this.bestText = txt(1, 0).setLineSpacing(2);
    this.rivalText = txt(0.5, 0);
    this.comboText = txt(0.5, 0.5).setColor('#ffd23f');
    this.msgText = txt(0.5, 0.5).setLineSpacing(8);

    this.layout();
    this.applyUnlocks(false);
    this.applyRival();
    this.setHearts();
    this.showTitle();

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.sfx.unlock();
      const b = this.muteBtn;
      if (Math.abs(p.x - b.x) < this.u && Math.abs(p.y - b.y) < this.u) this.toggleMute();
      else this.onInput(p.x < this.scale.width / 2 ? -1 : 1);
    });
    const kb = this.input.keyboard;
    if (kb) {
      kb.addCapture('SPACE,LEFT,RIGHT,A,D');
      kb.on('keydown', (e: KeyboardEvent) => {
        if (e.repeat) return;
        this.sfx.unlock();
        if (e.code === 'KeyM') return this.toggleMute();
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.onInput(-1);
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.onInput(1);
        else if (e.code === 'Space') this.onInput(0);
      });
    }
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.pause, this);
    (window as unknown as { __cc?: DebugState }).__cc = this.dbg;
  }

  // ---------- setup helpers ----------

  private toggleMute(): void {
    this.sfx.setMuted(!this.sfx.muted);
    platform.save('mute', this.sfx.muted ? '1' : '0');
    drawSpeaker(this.muteBtn, this.u * 0.45, this.sfx.muted);
  }

  private loadSave(): void {
    try {
      const raw = platform.load('save');
      if (!raw) return;
      const d = JSON.parse(raw) as { best?: unknown; bestRival?: unknown; bestKos?: unknown };
      if (typeof d.best === 'number') this.best = d.best;
      if (typeof d.bestRival === 'number') this.bestRival = d.bestRival;
      if (typeof d.bestKos === 'number') this.bestKos = d.bestKos;
    } catch {
      /* corrupt save: start fresh */
    }
  }

  /** Mid-run saves keep the run score out of `best` so the game over card can still say NEW BEST. */
  private writeSave(): void {
    const best = Math.max(this.best, this.score);
    platform.save('save', JSON.stringify({ best, bestRival: this.bestRival, bestKos: this.bestKos }));
  }

  /** Auto-equips the newest unlocked gloves / ring; `announce` pops a message for fresh unlocks. */
  private applyUnlocks(announce: boolean): void {
    const best = Math.max(this.best, this.score);
    const g = topUnlocked(GLOVES, this.bestKos, best);
    const f = topUnlocked(FLOORS, this.bestKos, best);
    const fresh = g !== this.gloveIdx || f !== this.floorIdx;
    if (announce && !fresh) return;
    if (announce) {
      const text = g !== this.gloveIdx ? `NEW ${GLOVES[g].name.toUpperCase()} GLOVES!` : `NEW ${FLOORS[f].name.toUpperCase()} RING!`;
      this.popups.spawn(text, '#7CFC9A', this.cx, this.scale.height * 0.66, 1, 1400);
      this.writeSave();
    }
    this.gloveIdx = g;
    this.floorIdx = f;
    for (const gl of this.myGloves) gl.setColor(GLOVES[g].color);
    this.floor.setFillStyle(FLOORS[f].color, 0.12);
  }

  private layout(): void {
    const { width: w, height: h } = this.scale;
    const u = (this.u = Math.min(w, h * 0.62) / 10);
    this.cx = w / 2;
    this.cy = h * 0.36;
    const fs = Math.max(14, Math.round(u * 0.8));
    const pad = Math.round(u * 0.5);

    this.bg.setPosition(w / 2, h / 2).setSize(w, h);
    this.floor.setPosition(w / 2, h * 0.75).setSize(w, h * 0.5);
    this.divider.setPosition(w / 2, h / 2).setSize(4, h);
    this.flash.setPosition(w / 2, h / 2).setSize(w, h);
    this.dim.setPosition(w / 2, h / 2).setSize(w, h);
    drawArena(this.arena, w, h);
    this.drawFace();
    for (const g of this.oppGloves) g.resize(u * 1.1);
    for (const g of this.myGloves) g.resize(u * 1.4);
    this.particles.setUnit(u);
    this.popups.setUnit(u, Math.round(fs * 1.5));
    this.ring.setRadius(u * 1.1);

    this.scoreText.setPosition(pad, pad).setFontSize(fs);
    this.bestText.setPosition(w - pad, pad).setFontSize(Math.round(fs * 0.7));
    this.rivalText.setPosition(w / 2, this.cy + u * 4.5).setFontSize(Math.round(fs * 0.75));
    this.comboText.setPosition(w / 2, h * 0.58).setFontSize(Math.round(fs * 1.6));
    // cap by width so "COUNTER CHAMP" stays on one line on narrow phones
    this.msgText.setPosition(w / 2, h * 0.53).setFontSize(Math.round(Math.min(fs * 1.3, w / 11))).setWordWrapWidth(w * 0.9);

    const barX = pad + MAX_HEARTS * u * 1.1 + u * 0.3;
    this.barW = w - pad - u * 1.5 - barX;
    const barY = pad + fs * 2.4;
    this.koBg.setPosition(barX, barY).setSize(this.barW, u * 0.5);
    this.koFill.setPosition(barX, barY).setSize(this.barW, u * 0.5);
    this.heartIcons.forEach((hi, i) => hi.setRadius(u * 0.4).setPosition(pad + u * 0.4 + i * u * 1.1, barY));
    this.muteBtn.setPosition(w - pad - u * 0.55, barY);
    drawSpeaker(this.muteBtn, u * 0.45, this.sfx.muted);
  }

  private applyRival(): void {
    this.drawFace();
    this.rivalText.setText(`#${this.level + 1} ${rivalFor(this.level).name.toUpperCase()}`);
  }

  private drawFace(): void {
    if (this.u > 0) drawFighter(this.fighter, this.u, rivalFor(this.level), this.face);
  }

  private setHearts(): void {
    this.heartIcons.forEach((hi, i) => hi.setFillStyle(i < this.hearts ? 0xe63946 : 0x3a3a4a));
  }

  /** `dim`: 0 = none, else overlay alpha (title uses a light one so the fighter still shows). */
  private setMsg(text: string, dim: number): void {
    this.msgText.setText(text).setVisible(text !== '');
    this.dim.setVisible(dim > 0).setFillStyle(0x000000, dim);
  }

  private showTitle(): void {
    this.state = 'title';
    const goal = nextGoal(this.bestKos, this.best);
    this.setMsg(`COUNTER CHAMP\nNEON NIGHT\n\nTAP TO FIGHT\nBest ${this.best}${goal ? `\n\n${goal}` : ''}`, 0.35);
  }

  private pop(text: string, color: string): void {
    this.popups.spawn(text, color, this.cx, this.cy - this.u * 2.9, 1, 800);
  }

  // ---------- input ----------

  private onInput(side: -1 | 0 | 1): void {
    switch (this.state) {
      case 'title':
        this.startRun();
        break;
      case 'over':
        if (this.t - this.overAt < RETRY_LOCK_MS) break;
        if (side === 1 && !this.continued) void this.continueRun();
        else void this.retry();
        break;
      case 'paused':
        this.resume();
        break;
      case 'threat':
        this.judge(side);
        break;
      default:
        break;
    }
  }

  private pause(): void {
    if (this.state === 'title' || this.state === 'over' || this.state === 'paused' || this.state === 'ad') return;
    this.pausedFrom = this.state;
    this.state = 'paused';
    platform.gameplayStop();
    this.setMsg('PAUSED\n\nTAP TO RESUME', 0.6);
  }

  private resume(): void {
    this.state = this.pausedFrom;
    this.setMsg('', 0);
    platform.gameplayStart();
  }

  // ---------- run flow ----------

  private startRun(): void {
    this.score = 0;
    this.hearts = MAX_HEARTS;
    this.combo = 0;
    this.ko = 0;
    this.level = 0;
    this.tn = tuning(0);
    this.newBest = false;
    this.continued = false;
    this.runStart = this.t;
    this.oppOffX = 0;
    this.oppOffY = 0;
    this.fx = 'none';
    this.face = 'normal';
    this.sfx.start();
    this.applyRival();
    this.setHearts();
    this.setMsg('', 0);
    this.beginIdle();
    platform.gameplayStart();
  }

  /** Runs an ad with game time frozen and sound off; always returns to normal sound. */
  private async inAd<T>(run: () => Promise<T>): Promise<T> {
    const wasMuted = this.sfx.muted;
    this.state = 'ad';
    this.sfx.setMuted(true);
    try {
      return await run();
    } finally {
      this.sfx.setMuted(wasMuted);
      this.lastAdAt = performance.now();
    }
  }

  /** Natural break: interstitial (rate-limited) before the next run. */
  private async retry(): Promise<void> {
    this.runsSinceAd++;
    if (this.runsSinceAd >= AD_EVERY_RUNS && performance.now() - this.lastAdAt >= AD_COOLDOWN_MS) {
      this.runsSinceAd = 0;
      await this.inAd(() => platform.commercialBreak());
    }
    this.startRun();
  }

  /** Optional rewarded ad: once per run, resume on the same rival with 2 hearts. */
  private async continueRun(): Promise<void> {
    this.continued = true;
    const ok = await this.inAd(() => platform.rewardedBreak());
    if (!ok) {
      this.state = 'over';
      this.showOver();
      return;
    }
    this.hearts = 2;
    this.setHearts();
    this.combo = 0;
    this.setMsg('', 0);
    this.beginIdle();
    platform.gameplayStart();
  }

  private beginIdle(): void {
    this.state = 'idle';
    this.timer = this.t + rand(this.tn.idleMinMs, this.tn.idleMaxMs);
  }

  private planSequence(): void {
    const tn = this.tn;
    const double = Math.random() < tn.doubleChance;
    const a = this.seq[0];
    a.side = Math.random() < 0.5 ? -1 : 1;
    a.feint = !double && Math.random() < tn.feintChance;
    a.windupMs = tn.windupMs;
    this.seqLen = double ? 2 : 1;
    if (double) {
      const b = this.seq[1];
      b.side = a.side === -1 ? 1 : -1;
      b.feint = false;
      b.windupMs = tn.windupMs * 0.8;
    }
    this.seqIdx = 0;
  }

  private beginThreat(): void {
    const th = this.seq[this.seqIdx];
    this.state = 'threat';
    this.startT = this.t;
    this.impactAt = this.t + th.windupMs;
    this.oppGloves[th.side === -1 ? 0 : 1].setHot(true);
    this.sfx.whoosh();
  }

  private endThreat(): void {
    const th = this.seq[this.seqIdx];
    this.oppGloves[th.side === -1 ? 0 : 1].setHot(false);
    if (this.seqIdx + 1 < this.seqLen) {
      this.seqIdx++;
      this.state = 'gap';
      this.timer = this.t + GAP_MS;
    } else {
      this.beginIdle();
      this.timer = Math.max(this.timer, this.t + 600);
    }
  }

  private judge(side: -1 | 0 | 1): void {
    const th = this.seq[this.seqIdx];
    if (side !== 0) this.tapT[side === -1 ? 0 : 1] = 0;
    else this.tapT[th.side === -1 ? 0 : 1] = 0;
    // inputs land between frames: add the wall-clock time since the last update
    const now = this.t + Math.min(performance.now() - this.wall, 50);
    if (th.feint) {
      this.combo = 0;
      this.score = Math.max(0, this.score - 50);
      this.fx = 'none';
      this.pop('FEINT!', '#ff9f1c');
      this.sfx.feint();
      this.endThreat();
      return;
    }
    if (side !== 0 && side !== th.side) return this.miss('wrong');
    const dt = now - this.impactAt;
    if (dt < -this.tn.goodMs) return this.miss('early');
    if (Math.abs(dt) <= this.tn.perfectMs) return this.hitLanded(true);
    return this.hitLanded(false);
  }

  private hitLanded(perfect: boolean): void {
    const th = this.seq[this.seqIdx];
    this.fxSide = th.side;
    this.fxT = 0;
    const ix = this.cx + this.oppOffX + th.side * this.u * 1.9;
    const iy = this.cy - this.u * 0.3;
    if (perfect) {
      this.combo++;
      const gain = 100 * this.combo;
      this.score += gain;
      this.ko += this.tn.koPerfect;
      this.fx = 'counter';
      this.pop(this.combo > 1 ? `PERFECT x${this.combo}` : 'PERFECT!', '#ffd23f');
      this.popups.spawn(`+${gain}`, '#7CFC9A', ix, iy, 0.8, 700);
      this.particles.burst(ix, iy, 0xffd23f, 9, 9, 0.5);
      this.sfx.counter(this.combo);
      this.freeze = STOP_COUNTER_MS;
      this.cameras.main.shake(90, 0.006);
      this.hurtFace();
    } else {
      this.combo = 0;
      this.score += 20;
      this.ko += this.tn.koPerfect * KO_BLOCK_SHARE;
      this.fx = 'block';
      this.pop('BLOCK', '#8ecae6');
      this.particles.burst(ix, iy, 0xffffff, 4, 5, 0.35);
      this.sfx.block();
    }
    if (this.ko >= 0.999) this.startKo();
    else this.endThreat();
    this.applyUnlocks(true);
  }

  private miss(reason: MissReason): void {
    const th = this.seq[this.seqIdx];
    this.fxSide = th.side;
    this.fxT = 0;
    this.fx = 'hit';
    this.combo = 0;
    this.ko = Math.max(0, this.ko - KO_HIT_LOSS);
    this.pop(reason === 'early' ? 'TOO EARLY' : reason === 'wrong' ? 'WRONG SIDE' : 'TOO LATE', '#ff5a5a');
    this.flash.setAlpha(0.35);
    this.cameras.main.shake(140, 0.014);
    this.particles.burst(this.cx + th.side * this.u * 2.2, this.cy + this.u * 4.2, 0xff5a5a, 8, 8, 0.45);
    this.sfx.hit();
    this.freeze = STOP_COUNTER_MS;
    const protectedHeart = this.hearts === 1 && this.t - this.runStart < GRACE_MS;
    if (!protectedHeart) this.hearts--;
    this.setHearts();
    if (this.hearts <= 0) this.gameOver();
    else this.endThreat();
  }

  private startKo(): void {
    this.oppGloves[this.seq[this.seqIdx].side === -1 ? 0 : 1].setHot(false);
    this.state = 'ko';
    this.koT = 0;
    this.koSwapped = false;
    this.score += 500;
    this.ko = 1;
    this.pop('KNOCKOUT!', '#ffd23f');
    this.particles.burst(this.cx + this.oppOffX, this.cy - this.u * 0.9, 0xffd23f, 22, 12, 0.7);
    this.sfx.knockout();
    this.freeze = STOP_KO_MS;
    this.cameras.main.shake(260, 0.016);
    this.hurtFace();
    if (this.level + 1 > this.bestRival) this.bestRival = this.level + 1;
    if (this.level + 1 > this.bestKos) this.bestKos = this.level + 1;
    if ((this.level + 1) % HEAL_EVERY === 0 && this.hearts < MAX_HEARTS) {
      this.hearts++;
      this.setHearts();
      this.popups.spawn('+1 HEART', '#ff8fa3', this.cx, this.cy + this.u * 3.2, 0.9, 1100);
    }
  }

  private hurtFace(): void {
    this.face = 'hurt';
    this.faceT = this.t;
    this.drawFace();
  }

  private gameOver(): void {
    // the losing hit skips endThreat(): clear the telegraph so the next run starts clean
    for (const g of this.oppGloves) g.setHot(false);
    this.sfx.gameOver();
    this.state = 'over';
    this.overAt = this.t;
    platform.gameplayStop();
    if (this.score > this.best) {
      this.best = this.score;
      this.newBest = true;
    }
    if (this.level + 1 > this.bestRival) this.bestRival = this.level + 1;
    this.writeSave();
    this.showOver();
  }

  private showOver(): void {
    const goal = nextGoal(this.bestKos, this.best);
    const actions = this.continued ? 'TAP TO RETRY' : 'TAP LEFT: RETRY\nTAP RIGHT: CONTINUE (AD)';
    this.setMsg(
      `KNOCKED OUT\n\nScore ${this.score}\n${this.newBest ? 'NEW BEST!' : `Best ${this.best}`}\nBest rival #${this.bestRival}\n\n${goal ? `${goal}\n\n` : ''}${actions}`,
      0.6,
    );
  }

  // ---------- frame update ----------

  update(_time: number, delta: number): void {
    this.wall = performance.now();
    if (this.state !== 'paused') {
      const dt = Math.min(delta, 50);
      this.particles.update(dt);
      this.popups.update(dt);
      if (this.freeze > 0) {
        this.freeze -= dt;
      } else {
        this.t += dt;
        this.tapT[0] += dt;
        this.tapT[1] += dt;
        this.fxT += dt;
        this.advance(dt);
        if (this.face === 'hurt' && this.state !== 'ko' && this.t - this.faceT > 380) {
          this.face = 'normal';
          this.drawFace();
        }
      }
    }
    this.flash.setAlpha(Math.max(0, this.flash.alpha - delta / 400));
    this.render();
  }

  private advance(dt: number): void {
    switch (this.state) {
      case 'idle':
        if (this.t >= this.timer) {
          this.planSequence();
          this.beginThreat();
        }
        break;
      case 'gap':
        if (this.t >= this.timer) this.beginThreat();
        break;
      case 'threat':
        if (!this.seq[this.seqIdx].feint && this.t > this.impactAt + this.tn.goodMs) this.miss('late');
        else if (this.seq[this.seqIdx].feint && this.t > this.impactAt) this.endThreat();
        break;
      case 'ko':
        this.koT += dt;
        if (this.koT < KO_FALL_MS) {
          const k = this.koT / KO_FALL_MS;
          this.oppOffY = this.u * 5 * k * k;
        } else {
          if (!this.koSwapped) {
            this.koSwapped = true;
            this.level++;
            this.tn = tuning(this.level);
            this.ko = 0;
            this.oppOffY = 0;
            this.face = 'normal';
            this.applyRival();
          }
          this.oppOffX = (1 - easeOut(clamp01((this.koT - KO_FALL_MS) / (KO_TOTAL_MS - KO_FALL_MS)))) * this.scale.width;
          if (this.koT >= KO_TOTAL_MS) {
            this.oppOffX = 0;
            this.beginIdle();
          }
        }
        break;
      default:
        break;
    }
  }

  private render(): void {
    const { u, cx, cy } = this;
    const h = this.scale.height;
    const live = this.state === 'idle' || this.state === 'gap' || this.state === 'threat' || this.state === 'title';
    const bob = live ? Math.sin(this.t / 260) * u * 0.12 : 0;
    const recoil = this.fx === 'counter' && this.fxT < 250 ? -this.fxSide * u * 0.7 * (1 - this.fxT / 250) : 0;
    const ox = cx + this.oppOffX + recoil;
    const oy = this.oppOffY + bob;
    this.fighter.setPosition(ox, cy - u * 0.9 + oy);

    const threat = this.state === 'threat' ? this.seq[this.seqIdx] : null;
    let ringOn = false;
    for (let i = 0; i < 2; i++) {
      const s: Side = i === 0 ? -1 : 1;
      let gx = ox + s * u * 3;
      let gy = cy + u * 1.0 + oy;
      let gs = 1;
      if (threat && threat.side === s) {
        const p = clamp01((this.t - this.startT) / threat.windupMs);
        const canceled = threat.feint && p >= 0.55;
        const q = canceled ? 0 : easeOut(p);
        gx += s * u * 0.9 * q;
        gy -= u * 1.2 * q;
        gs = 1 + 0.35 * q;
        if (!canceled) {
          ringOn = true;
          this.ring.setPosition(gx, gy).setScale(1 + 2.6 * (1 - p));
          const dt = Math.abs(this.t - this.impactAt);
          const col = dt <= this.tn.perfectMs ? 0xffd23f : dt <= this.tn.goodMs ? 0xffffff : 0x9aa0b5;
          if (col !== this.ringColor) {
            this.ringColor = col;
            this.ring.setStrokeStyle(5, col);
          }
        }
      } else if (this.fx !== 'none' && this.fxSide === s && this.fxT < 320) {
        if (this.fx === 'hit') {
          const k = this.fxT < 120 ? this.fxT / 120 : 1 - (this.fxT - 120) / 200;
          gx -= s * u * 1.0 * k;
          gy += u * 3.4 * k;
          gs = 1 + 0.6 * k;
        } else if (this.fx === 'block') {
          const k = 1 - this.fxT / 320;
          gx += s * u * 0.8 * k;
          gy -= u * 0.6 * k;
        }
      }
      this.oppGloves[i].c.setPosition(gx, gy).setScale(gs);
    }
    this.ring.setVisible(ringOn);

    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1;
      const k = this.tapT[i] < 160 ? 1 - this.tapT[i] / 160 : 0;
      this.myGloves[i].c.setPosition(cx + s * u * 3.2 - s * u * k * 0.8, h - u * 1.7 - u * 2.2 * k).setScale(1 + 0.25 * k);
    }

    this.koFill.setScale(clamp01(this.ko), 1);
    if (this.score !== this.shownScore) {
      this.shownScore = this.score;
      this.scoreText.setText(`${this.score}`);
      this.bestText.setText(`BEST ${Math.max(this.best, this.score)}\nRIVAL #${Math.max(this.bestRival, this.level + 1)}`);
    }
    if (this.combo !== this.shownCombo) {
      this.shownCombo = this.combo;
      this.comboText.setText(this.combo > 1 ? `COMBO x${this.combo}` : '');
    }
    if (this.state === 'title') this.msgText.setAlpha(0.75 + 0.25 * Math.sin(this.t / 200));
    else this.msgText.setAlpha(1);
    this.divider.setVisible(this.state !== 'title');

    const d = this.dbg;
    d.state = this.state;
    d.score = this.score;
    d.hearts = this.hearts;
    d.level = this.level;
    d.msToImpact = threat ? this.impactAt - this.t : 9999;
    d.threatSide = threat ? threat.side : 0;
    d.feint = threat ? threat.feint : false;
    d.glove = this.gloveIdx;
  }
}
