import Phaser from 'phaser';
import { platform } from '../../src/platform';
import { Glove, INK, drawSpeaker } from '../../src/game/art';
import { Particles, Popups, TEXT_RES } from '../../src/game/Fx';
import { Sfx } from '../../src/game/Sfx';
import { RIVALS } from '../../src/game/tuning';

/** ALT-04 Four-Way Brawl: small brawlers rush in from 4 sides; tap their quadrant as they arrive. */
type State = 'title' | 'play' | 'over' | 'paused' | 'ad';

interface DebugState {
  state: State;
  score: number;
  hearts: number;
  level: number;
  /** ms until the next arrival and its direction (0 up, 1 right, 2 down, 3 left), for tests. */
  msToImpact: number;
  nextDir: number;
}

interface Brawler {
  c: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  ring: Phaser.GameObjects.Arc;
  dir: number;
  spawnT: number;
  impactAt: number;
  alive: boolean;
  /** > 0 while flying away after being punched (ms left). */
  flyT: number;
}

const FONT = 'system-ui, sans-serif';
const POOL = 8;
const HEARTS = 3;
const PERFECT_MS = 90;
const GOOD_MS = 190;
const RETRY_LOCK_MS = 350;
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const KEYS: Record<string, number> = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 };

export class BrawlScene extends Phaser.Scene {
  private state: State = 'title';
  private t = 0;
  private runStart = 0;
  private score = 0;
  private best = 0;
  private combo = 0;
  private hearts = HEARTS;
  private nextSpawn = 0;
  private overAt = 0;
  private freeze = 0;
  private readonly lastDirT = [-9999, -9999, -9999, -9999];
  private readonly punchT = [999, 999, 999, 999];
  private shownScore = -1;
  private gap = 1100;
  private travel = 1300;
  private level = 0;

  private u = 40;
  private cx = 0;
  private cy = 0;
  private reach = 0;

  private bg!: Phaser.GameObjects.Rectangle;
  private cross!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Arc;
  private gloves!: Glove[];
  private brawlers: Brawler[] = [];
  private particles!: Particles;
  private popups!: Popups;
  private flash!: Phaser.GameObjects.Rectangle;
  private dim!: Phaser.GameObjects.Rectangle;
  private heartIcons: Phaser.GameObjects.Arc[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private msgText!: Phaser.GameObjects.Text;
  private muteBtn!: Phaser.GameObjects.Graphics;
  private readonly sfx = new Sfx();
  private readonly dbg: DebugState = { state: 'title', score: 0, hearts: HEARTS, level: 0, msToImpact: 9999, nextDir: -1 };

  constructor() {
    super('Game');
  }

  create(): void {
    this.best = Number(platform.load('best')) || 0;
    this.sfx.muted = platform.load('mute') === '1';
    this.bg = this.add.rectangle(0, 0, 10, 10, 0x3b2f5c).setOrigin(0, 0);
    this.cross = this.add.graphics();
    for (let i = 0; i < POOL; i++) {
      const ring = this.add.circle(0, 0, 10).setFillStyle().setStrokeStyle(4, 0xffffff);
      const body = this.add.circle(0, 0, 10, 0xffffff).setStrokeStyle(4, INK);
      const eyeL = this.add.circle(0, 0, 3, INK);
      const eyeR = this.add.circle(0, 0, 3, INK);
      const c = this.add.container(0, 0, [body, eyeL, eyeR]).setVisible(false);
      this.brawlers.push({ c, body, ring: ring.setVisible(false), dir: 0, spawnT: 0, impactAt: 0, alive: false, flyT: 0 });
      c.setData('eyes', [eyeL, eyeR]);
    }
    this.player = this.add.circle(0, 0, 10, 0xf1c27d).setStrokeStyle(4, INK);
    this.gloves = [0, 1, 2, 3].map(() => new Glove(this, 0xe63946, 1));
    this.particles = new Particles(this);
    this.popups = new Popups(this);
    this.flash = this.add.rectangle(0, 0, 10, 10, 0xff2d2d, 0).setOrigin(0, 0);
    for (let i = 0; i < HEARTS; i++) this.heartIcons.push(this.add.circle(0, 0, 10, 0xe63946).setStrokeStyle(3, INK));
    this.dim = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.5).setOrigin(0, 0).setVisible(false);
    const txt = (ox: number, oy: number): Phaser.GameObjects.Text =>
      this.add.text(0, 0, '', { fontFamily: FONT, fontStyle: '800', color: '#ffffff', stroke: '#14141f', strokeThickness: 5, align: 'center', resolution: TEXT_RES })
        .setOrigin(ox, oy);
    this.scoreText = txt(0, 0);
    this.bestText = txt(1, 0);
    this.msgText = txt(0.5, 0.5).setLineSpacing(8);
    this.muteBtn = this.add.graphics();

    this.layout();
    this.showTitle();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.sfx.unlock();
      if (Math.abs(p.x - this.muteBtn.x) < this.u && Math.abs(p.y - this.muteBtn.y) < this.u) return this.toggleMute();
      const dx = p.x - this.cx;
      const dy = p.y - this.cy;
      this.onInput(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0);
    });
    const kb = this.input.keyboard;
    if (kb) {
      kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT,W,A,S,D');
      kb.on('keydown', (e: KeyboardEvent) => {
        if (e.repeat) return;
        this.sfx.unlock();
        if (e.code === 'KeyM') return this.toggleMute();
        const d = KEYS[e.code];
        if (d !== undefined) this.onInput(d);
        else if (e.code === 'Space') this.onInput(this.dbg.nextDir >= 0 ? this.dbg.nextDir : 0);
      });
    }
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.pause, this);
    (window as unknown as { __cc?: DebugState }).__cc = this.dbg;
  }

  private toggleMute(): void {
    this.sfx.setMuted(!this.sfx.muted);
    platform.save('mute', this.sfx.muted ? '1' : '0');
    drawSpeaker(this.muteBtn, this.u * 0.45, this.sfx.muted);
  }

  private layout(): void {
    const { width: w, height: h } = this.scale;
    const u = (this.u = Math.min(w, h) / 12);
    this.cx = w / 2;
    this.cy = h / 2 + u * 0.4;
    this.reach = u * 1.6;
    const fs = Math.max(14, Math.round(u * 0.75));
    const pad = Math.round(u * 0.45);
    this.bg.setSize(w, h);
    this.flash.setSize(w, h);
    this.dim.setSize(w, h);
    this.cross.clear().lineStyle(3, 0xffffff, 0.08)
      .lineBetween(this.cx - h, this.cy - h, this.cx + h, this.cy + h)
      .lineBetween(this.cx + h, this.cy - h, this.cx - h, this.cy + h);
    this.cross.fillStyle(0xffffff, 0.05).fillCircle(this.cx, this.cy, u * 2.4);
    this.player.setPosition(this.cx, this.cy).setRadius(u * 0.9);
    for (const g of this.gloves) g.resize(u * 0.5);
    for (const b of this.brawlers) {
      b.body.setRadius(u * 0.75);
      const [l, r] = b.c.getData('eyes') as Phaser.GameObjects.Arc[];
      l.setRadius(u * 0.1).setPosition(-u * 0.25, -u * 0.1);
      r.setRadius(u * 0.1).setPosition(u * 0.25, -u * 0.1);
    }
    this.particles.setUnit(u);
    this.popups.setUnit(u, Math.round(fs * 1.4));
    this.scoreText.setPosition(pad, pad).setFontSize(fs);
    this.bestText.setPosition(w - pad, pad).setFontSize(Math.round(fs * 0.7));
    this.msgText.setPosition(w / 2, h * 0.25).setFontSize(Math.round(Math.min(fs * 1.3, w / 11))).setWordWrapWidth(w * 0.9);
    this.heartIcons.forEach((hi, i) => hi.setRadius(u * 0.3).setPosition(pad + u * 0.3 + i * u * 0.8, pad + fs * 2));
    this.muteBtn.setPosition(w - pad - u * 0.5, pad + fs * 2.4);
    drawSpeaker(this.muteBtn, u * 0.4, this.sfx.muted);
  }

  private setMsg(text: string, dim: boolean): void {
    this.msgText.setText(text).setVisible(text !== '');
    this.dim.setVisible(dim);
  }

  private showTitle(): void {
    this.state = 'title';
    this.setMsg(`FOUR-WAY BRAWL\n\nTAP TO FIGHT\nBest ${this.best}`, false);
  }

  private setHearts(): void {
    this.heartIcons.forEach((hi, i) => hi.setFillStyle(i < this.hearts ? 0xe63946 : 0x3a3a4a));
  }

  private onInput(dir: number): void {
    if (this.state === 'title') return this.startRun();
    if (this.state === 'paused') return this.resume();
    if (this.state === 'over') {
      if (this.t - this.overAt >= RETRY_LOCK_MS) void this.retry();
      return;
    }
    if (this.state === 'play') this.punch(dir);
  }

  private pause(): void {
    if (this.state !== 'play') return;
    this.state = 'paused';
    platform.gameplayStop();
    this.setMsg('PAUSED\n\nTAP TO RESUME', true);
  }

  private resume(): void {
    this.state = 'play';
    this.setMsg('', false);
    platform.gameplayStart();
  }

  private startRun(): void {
    this.state = 'play';
    this.score = 0;
    this.combo = 0;
    this.hearts = HEARTS;
    this.runStart = this.t;
    this.nextSpawn = this.t + 600;
    this.updatePace();
    for (const b of this.brawlers) this.kill(b);
    this.setHearts();
    this.setMsg('', false);
    this.sfx.start();
    platform.gameplayStart();
  }

  private async retry(): Promise<void> {
    this.state = 'ad';
    await platform.commercialBreak();
    this.startRun();
  }

  /** Difficulty from run time: spawn gap 1100 → 420 ms, travel 1300 → 650 ms (fields, no per-frame objects). */
  private updatePace(): void {
    const k = Math.min(1, (this.t - this.runStart) / 90000);
    this.gap = 1100 - 680 * k;
    this.travel = 1300 - 650 * k;
    this.level = Math.floor(k * 9);
  }

  private spawn(): void {
    let b: Brawler | null = null;
    for (const x of this.brawlers) if (!x.alive && x.flyT <= 0) b = x;
    if (!b) return;
    let dir = Math.floor(Math.random() * 4);
    // never two arrivals from the same side closer than 380 ms
    for (let i = 0; i < 4 && this.t + this.travel - this.lastDirT[dir] < 380; i++) dir = (dir + 1) % 4;
    b.dir = dir;
    b.spawnT = this.t;
    b.impactAt = this.t + this.travel;
    this.lastDirT[dir] = b.impactAt;
    b.alive = true;
    b.flyT = 0;
    b.body.setFillStyle(RIVALS[Math.floor(Math.random() * RIVALS.length)].color);
    b.c.setVisible(true).setAlpha(1).setScale(1);
    b.ring.setVisible(true);
    this.sfx.whoosh();
  }

  private kill(b: Brawler): void {
    b.alive = false;
    b.flyT = 0;
    b.c.setVisible(false);
    b.ring.setVisible(false);
  }

  private punch(dir: number): void {
    this.punchT[dir] = 0;
    let target: Brawler | null = null;
    for (const b of this.brawlers) if (b.alive && b.dir === dir && (!target || b.impactAt < target.impactAt)) target = b;
    const dt = target ? this.t - target.impactAt : -9999;
    if (!target || dt < -GOOD_MS) {
      this.combo = 0;
      this.popups.spawn('MISS', '#9aa0b5', this.cx + DX[dir] * this.u * 2, this.cy + DY[dir] * this.u * 2, 0.7, 500);
      return;
    }
    const perfect = Math.abs(dt) <= PERFECT_MS;
    this.combo = perfect ? this.combo + 1 : 0;
    const gain = perfect ? 100 * Math.min(this.combo, 10) : 30;
    this.score += gain;
    const x = target.c.x;
    const y = target.c.y;
    this.popups.spawn(perfect ? (this.combo > 1 ? `POW x${this.combo}` : 'POW!') : 'OK', perfect ? '#ffd23f' : '#8ecae6', x, y - this.u, perfect ? 1 : 0.8, 650);
    this.particles.burst(x, y, perfect ? 0xffd23f : 0xffffff, perfect ? 10 : 5, 9, 0.45);
    if (perfect) {
      this.sfx.counter(this.combo);
      this.freeze = 50;
      this.cameras.main.shake(70, 0.005);
    } else this.sfx.block();
    target.alive = false;
    target.ring.setVisible(false);
    target.flyT = 350;
  }

  private hurt(b: Brawler): void {
    this.kill(b);
    this.combo = 0;
    this.hearts--;
    this.setHearts();
    this.flash.setAlpha(0.35);
    this.cameras.main.shake(140, 0.014);
    this.particles.burst(this.cx, this.cy, 0xff5a5a, 8, 8, 0.45);
    this.sfx.hit();
    this.freeze = 70;
    if (this.hearts <= 0) this.gameOver();
  }

  private gameOver(): void {
    this.state = 'over';
    this.overAt = this.t;
    this.sfx.gameOver();
    platform.gameplayStop();
    const newBest = this.score > this.best;
    if (newBest) {
      this.best = this.score;
      platform.save('best', String(this.best));
    }
    const secs = ((this.t - this.runStart) / 1000).toFixed(0);
    this.setMsg(`KNOCKED OUT\n\nScore ${this.score}\n${newBest ? 'NEW BEST!' : `Best ${this.best}`}\nLasted ${secs}s\n\nTAP TO RETRY`, true);
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    if (this.state !== 'paused' && this.state !== 'ad') {
      this.particles.update(dt);
      this.popups.update(dt);
      if (this.freeze > 0) this.freeze -= dt;
      else {
        this.t += dt;
        for (let i = 0; i < 4; i++) this.punchT[i] += dt;
        if (this.state === 'play') this.step(dt);
      }
    }
    this.flash.setAlpha(Math.max(0, this.flash.alpha - delta / 400));
    this.render();
  }

  private step(dt: number): void {
    this.updatePace();
    if (this.t >= this.nextSpawn) {
      this.spawn();
      this.nextSpawn = this.t + this.gap * (0.8 + Math.random() * 0.4);
    }
    for (const b of this.brawlers) {
      if (b.alive && this.t > b.impactAt + GOOD_MS) this.hurt(b);
      if (this.state !== 'play') return;
      if (b.flyT > 0) {
        b.flyT -= dt;
        if (b.flyT <= 0) this.kill(b);
      }
    }
  }

  private render(): void {
    const { u, cx, cy } = this;
    const { width: w, height: h } = this.scale;
    let next: Brawler | null = null;
    for (const b of this.brawlers) {
      if (b.alive) {
        const k = Phaser.Math.Clamp((this.t - b.spawnT) / (b.impactAt - b.spawnT), 0, 1);
        // start just off the screen edge on that axis
        const far = (DX[b.dir] !== 0 ? w / 2 : h / 2 - u * 0.4) + u * 0.6;
        const r = far + (this.reach + u * 0.6 - far) * k;
        const x = cx + DX[b.dir] * r;
        const y = cy + DY[b.dir] * r;
        b.c.setPosition(x, y);
        const left = b.impactAt - this.t;
        b.ring.setPosition(x, y).setRadius(u * 0.8 * (1 + 2.2 * Phaser.Math.Clamp(left / 900, 0, 1)));
        b.ring.setStrokeStyle(4, Math.abs(left) <= PERFECT_MS ? 0xffd23f : 0xffffff);
        if (!next || b.impactAt < next.impactAt) next = b;
      } else if (b.flyT > 0) {
        const k = 1 - b.flyT / 350;
        b.c.setPosition(b.c.x + DX[b.dir] * u * 0.5, b.c.y + DY[b.dir] * u * 0.5).setScale(1 - k * 0.5).setAlpha(1 - k);
      }
    }
    for (let i = 0; i < 4; i++) {
      const k = this.punchT[i] < 140 ? 1 - this.punchT[i] / 140 : 0;
      const r = u * 1.15 + this.reach * 0.55 * k;
      this.gloves[i].c.setPosition(cx + DX[i] * r, cy + DY[i] * r).setScale(1 + 0.3 * k);
    }
    if (this.score !== this.shownScore) {
      this.shownScore = this.score;
      this.scoreText.setText(`${this.score}`);
      this.bestText.setText(`BEST ${Math.max(this.best, this.score)}`);
    }
    if (this.state === 'title') this.msgText.setAlpha(0.75 + 0.25 * Math.sin(this.t / 200));
    else this.msgText.setAlpha(1);
    const d = this.dbg;
    d.state = this.state;
    d.score = this.score;
    d.hearts = this.hearts;
    d.level = this.level;
    d.msToImpact = next ? next.impactAt - this.t : 9999;
    d.nextDir = next ? next.dir : -1;
  }
}
