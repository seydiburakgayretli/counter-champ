import Phaser from 'phaser';
import type { Rival } from '../../src/game/tuning';

/** ALT-08 Doodle: pencil ink on paper. */
export const INK = 0x2b2b33;
export const PAPER = 0xf7f1e3;

const shade = (c: number, k: number): number => {
  const r = Math.round(((c >> 16) & 255) * k);
  const g = Math.round(((c >> 8) & 255) * k);
  const b = Math.round((c & 255) * k);
  return (r << 16) | (g << 8) | b;
};

/** Boxing glove: glow + cuff + fist + thumb + shine, grouped so it moves and scales as one. */
export class Glove {
  readonly c: Phaser.GameObjects.Container;
  private readonly glow: Phaser.GameObjects.Arc;
  private readonly cuff: Phaser.GameObjects.Rectangle;
  private readonly base: Phaser.GameObjects.Arc;
  private readonly thumb: Phaser.GameObjects.Arc;
  private readonly shine: Phaser.GameObjects.Arc;
  private color: number;

  /** `side` is the screen side the glove sits on; the thumb points toward the centre. */
  constructor(scene: Phaser.Scene, color: number, private readonly side: -1 | 1) {
    this.color = color;
    this.glow = scene.add.circle(0, 0, 10, 0xffd23f, 0);
    this.cuff = scene.add.rectangle(0, 0, 10, 10, 0xf5f5f5).setStrokeStyle(3, INK);
    this.thumb = scene.add.circle(0, 0, 10, color).setStrokeStyle(3, INK);
    this.base = scene.add.circle(0, 0, 10, color).setStrokeStyle(3, INK);
    this.shine = scene.add.circle(0, 0, 10, 0xffffff, 0.35);
    this.c = scene.add.container(0, 0, [this.glow, this.cuff, this.thumb, this.base, this.shine]);
  }

  resize(r: number): void {
    const s = this.side;
    this.glow.setRadius(r * 1.5);
    this.cuff.setSize(r * 1.35, r * 0.7).setPosition(0, r * 1.05);
    this.thumb.setRadius(r * 0.42).setPosition(-s * r * 0.78, r * 0.3);
    this.base.setRadius(r);
    this.shine.setRadius(r * 0.22).setPosition(s * r * 0.35, -r * 0.45);
  }

  setColor(color: number): void {
    this.color = color;
    this.base.setFillStyle(color);
    this.thumb.setFillStyle(color);
  }

  /** Telegraph look: bright yellow with a halo. */
  setHot(on: boolean): void {
    const c = on ? 0xffd23f : this.color;
    this.base.setFillStyle(c);
    this.thumb.setFillStyle(c);
    this.glow.setAlpha(on ? 0.35 : 0);
  }
}

export type Face = 'normal' | 'hurt';

/** Cheap seeded noise so a "boil" redraw wobbles the same way each frame for a given seed. */
function jit(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

/** Hand-drawn closed shape: a wobbly polygon around an ellipse, stroked twice slightly offset. */
function sketchEllipse(g: Phaser.GameObjects.Graphics, x: number, y: number, rx: number, ry: number, fill: number, seed: number, wob: number): void {
  const n = 18;
  g.fillStyle(fill, 0.85).fillEllipse(x + wob * 0.6, y + wob * 0.4, rx * 2, ry * 2);
  for (let pass = 0; pass < 2; pass++) {
    g.beginPath();
    for (let i = 0; i <= n + 1; i++) {
      const a = (i / n) * Math.PI * 2 + pass * 0.2;
      const r = 1 + jit(seed + pass * 7, i % n) * 0.06;
      const px = x + Math.cos(a) * rx * r;
      const py = y + Math.sin(a) * ry * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
  }
}

function sketchRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, seed: number, wob: number): void {
  g.fillStyle(fill, 0.85).fillRect(x + wob * 0.5, y + wob * 0.5, w, h);
  for (let pass = 0; pass < 2; pass++) {
    const j = (i: number): number => jit(seed + pass * 5, i) * wob;
    g.beginPath();
    g.moveTo(x + j(0), y + j(1));
    g.lineTo(x + w + j(2), y + j(3));
    g.lineTo(x + w + j(4), y + h + j(5));
    g.lineTo(x + j(6), y + h + j(7));
    g.lineTo(x + j(8), y + j(9) + wob);
    g.strokePath();
  }
}

/** Doodled opponent around (0, 0) = head centre; `seed` changes ~8x/s for the line boil. */
export function drawFighter(g: Phaser.GameObjects.Graphics, u: number, r: Rival, face: Face, seed = 1): void {
  g.clear();
  g.lineStyle(Math.max(2, u * 0.09), INK, 1);
  const wob = u * 0.12;
  const bw = u * 5 * r.wide;
  const bh = u * 4.2;
  const by = u * 2.8 - bh / 2;
  sketchRect(g, -bw * 0.42, by, bw * 0.84, bh * 0.6, 0xffe2c2, seed, wob);
  sketchRect(g, -bw / 2, by + bh * 0.42, bw, bh * 0.58, r.color, seed + 1, wob);
  const hr = u * 1.5;
  if (r.hair === 1 || r.hair === 2) {
    g.fillStyle(shade(r.color, 0.7), 0.9);
    const n = r.hair === 1 ? 5 : 1;
    for (let i = 0; i < n; i++) {
      const cx = (i - (n - 1) / 2) * hr * 0.42;
      g.fillTriangle(cx - hr * 0.25, -hr * 0.75, cx + hr * 0.25, -hr * 0.75, cx + jit(seed, i) * wob * 2, -hr * (r.hair === 2 ? 1.8 : 1.5));
      g.strokeTriangle(cx - hr * 0.25, -hr * 0.75, cx + hr * 0.25, -hr * 0.75, cx + jit(seed, i) * wob * 2, -hr * (r.hair === 2 ? 1.8 : 1.5));
    }
  }
  sketchEllipse(g, 0, 0, hr, hr, 0xffe2c2, seed + 2, wob);
  if (r.hair === 3) sketchRect(g, -hr * 0.97, -hr * 0.62, hr * 1.94, hr * 0.3, r.color, seed + 3, wob);
  if (r.hair === 4) {
    g.fillStyle(0xffd23f, 0.9).fillTriangle(-hr * 0.6, -hr * 0.85, 0, -hr * 1.7, hr * 0.6, -hr * 0.85);
    g.strokeTriangle(-hr * 0.6, -hr * 0.85, 0, -hr * 1.7, hr * 0.6, -hr * 0.85);
  }
  const ey = -hr * 0.05;
  const ex = hr * 0.42;
  if (face === 'hurt') {
    for (const s of [-1, 1]) {
      g.lineBetween(s * ex - u * 0.3, ey - u * 0.3, s * ex + u * 0.3, ey + u * 0.3);
      g.lineBetween(s * ex - u * 0.3, ey + u * 0.3, s * ex + u * 0.3, ey - u * 0.3);
    }
    sketchEllipse(g, 0, hr * 0.55, u * 0.45, u * 0.3, 0xc2405a, seed + 4, wob * 0.5);
  } else {
    g.fillStyle(INK, 1).fillCircle(-ex, ey, u * 0.16).fillCircle(ex, ey, u * 0.16);
    g.lineBetween(-ex - u * 0.4, ey - u * 0.55 + jit(seed, 1) * wob, -ex + u * 0.4, ey - u * 0.35);
    g.lineBetween(ex + u * 0.4, ey - u * 0.55 + jit(seed, 2) * wob, ex - u * 0.4, ey - u * 0.35);
    g.lineBetween(-u * 0.4, hr * 0.55, u * 0.4, hr * 0.55 + jit(seed, 3) * wob);
  }
}

/** ALT-08 arena: notebook paper (ruled lines, red margin) with pencil ropes. */
export function drawArena(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  g.clear();
  g.fillStyle(PAPER, 1).fillRect(0, 0, w, h);
  g.lineStyle(1, 0x9cc3e6, 0.6);
  for (let y = h * 0.06; y < h; y += Math.max(18, h * 0.04)) g.lineBetween(0, y, w, y);
  g.lineStyle(2, 0xe06c75, 0.6).lineBetween(w * 0.08, 0, w * 0.08, h);
  for (let i = 0; i < 3; i++) {
    const y = h * (0.3 + i * 0.075);
    g.lineStyle(3, INK, 0.85).beginPath();
    for (let k = 0; k <= 20; k++) {
      const x = (k / 20) * w;
      const yy = y + jit(i + 1, k) * 4 + Math.sin(k * 0.7 + i) * 2;
      if (k === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.strokePath();
  }
}

/** Speaker icon; `muted` adds a cross, otherwise sound waves. Centre (0, 0), half-size `r`. */
export function drawSpeaker(g: Phaser.GameObjects.Graphics, r: number, muted: boolean): void {
  g.clear();
  g.fillStyle(0x000000, 0.35).fillCircle(0, 0, r * 1.25);
  g.fillStyle(0xffffff, 1);
  g.fillRect(-r * 0.7, -r * 0.3, r * 0.4, r * 0.6);
  g.fillTriangle(-r * 0.3, -r * 0.3, -r * 0.3, r * 0.3, r * 0.15, r * 0.7);
  g.fillTriangle(-r * 0.3, -r * 0.3, r * 0.15, -r * 0.7, r * 0.15, r * 0.7);
  g.lineStyle(Math.max(2, r * 0.18), 0xffffff, 1);
  if (muted) {
    g.lineStyle(Math.max(3, r * 0.22), 0xff5a5a, 1).lineBetween(r * 0.35, -r * 0.45, r * 0.9, r * 0.45).lineBetween(r * 0.35, r * 0.45, r * 0.9, -r * 0.45);
  } else {
    g.beginPath().arc(r * 0.05, 0, r * 0.6, -0.9, 0.9).strokePath();
    g.beginPath().arc(r * 0.05, 0, r * 0.95, -0.9, 0.9).strokePath();
  }
}
