import Phaser from 'phaser';
import type { Rival } from '../../src/game/tuning';

export const INK = 0x0b0820;
/** ALT-07 Neon: dark fills, neon outlines (glow comes from postFX in the scene). */
const SKIN = 0x1a1630;
const DARK = 0x120f26;

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
    this.cuff = scene.add.rectangle(0, 0, 10, 10, DARK).setStrokeStyle(3, 0xffffff);
    this.thumb = scene.add.circle(0, 0, 10, DARK).setStrokeStyle(4, color);
    this.base = scene.add.circle(0, 0, 10, DARK).setStrokeStyle(4, color);
    this.shine = scene.add.circle(0, 0, 10, color, 0.5);
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
    this.base.setStrokeStyle(4, color);
    this.thumb.setStrokeStyle(4, color);
    this.shine.setFillStyle(color, 0.5);
  }

  /** Telegraph look: bright yellow with a halo. */
  setHot(on: boolean): void {
    const c = on ? 0xffe95c : this.color;
    this.base.setStrokeStyle(on ? 6 : 4, c).setFillStyle(on ? 0x4a3a10 : DARK);
    this.thumb.setStrokeStyle(on ? 6 : 4, c);
    this.glow.setAlpha(on ? 0.25 : 0);
  }
}

export type Face = 'normal' | 'hurt';

/** Draws the opponent around (0, 0) = head centre column; body below. Call on rival/layout/face change only. */
export function drawFighter(g: Phaser.GameObjects.Graphics, u: number, r: Rival, face: Face): void {
  g.clear();
  g.lineStyle(Math.max(2, u * 0.12), r.color, 1);
  const bw = u * 5 * r.wide;
  const bh = u * 4.2;
  const by = u * 2.8 - bh / 2; // body top relative to head centre (body centre sits 2.8u below)
  // torso (skin) + shorts
  g.fillStyle(SKIN, 1).fillRoundedRect(-bw * 0.42, by, bw * 0.84, bh * 0.6, u * 0.5).strokeRoundedRect(-bw * 0.42, by, bw * 0.84, bh * 0.6, u * 0.5);
  g.fillStyle(shade(r.color, 0.3), 1).fillRoundedRect(-bw / 2, by + bh * 0.42, bw, bh * 0.58, u * 0.6).strokeRoundedRect(-bw / 2, by + bh * 0.42, bw, bh * 0.58, u * 0.6);
  g.fillStyle(r.color, 1).fillRect(-bw / 2 + 2, by + bh * 0.42 + u * 0.35, bw - 4, u * 0.12);
  g.fillStyle(shade(r.color, 0.7), 1).fillCircle(0, by + bh * 0.8, u * 0.45).strokeCircle(0, by + bh * 0.8, u * 0.45);
  // head
  const hr = u * 1.5;
  switch (r.hair) {
    case 1: // spikes
      g.fillStyle(shade(r.color, 0.6), 1);
      for (let i = -2; i <= 2; i++) g.fillTriangle(i * hr * 0.42 - hr * 0.26, -hr * 0.78, i * hr * 0.42 + hr * 0.26, -hr * 0.78, i * hr * 0.42, -hr * 1.55 + Math.abs(i) * hr * 0.12);
      break;
    case 2: // mohawk
      g.fillStyle(shade(r.color, 0.8), 1).fillTriangle(-hr * 0.28, -hr * 0.8, hr * 0.28, -hr * 0.8, 0, -hr * 1.8);
      break;
    default:
      break;
  }
  g.lineStyle(Math.max(6, u * 0.4), r.color, 0.18).strokeCircle(0, 0, hr).strokeRoundedRect(-bw / 2, by + bh * 0.42, bw, bh * 0.58, u * 0.6);
  g.lineStyle(Math.max(2, u * 0.12), r.color, 1);
  g.fillStyle(SKIN, 1).fillCircle(0, 0, hr).strokeCircle(0, 0, hr);
  if (r.hair === 3) g.fillStyle(r.color, 1).fillRect(-hr * 0.97, -hr * 0.62, hr * 1.94, hr * 0.34).strokeRect(-hr * 0.97, -hr * 0.62, hr * 1.94, hr * 0.34);
  if (r.hair === 4) {
    g.fillStyle(0xffd23f, 1);
    g.fillTriangle(-hr * 0.7, -hr * 0.85, -hr * 0.7, -hr * 1.5, -hr * 0.3, -hr * 1.05);
    g.fillTriangle(-hr * 0.2, -hr * 0.95, 0, -hr * 1.7, hr * 0.2, -hr * 0.95);
    g.fillTriangle(hr * 0.7, -hr * 0.85, hr * 0.7, -hr * 1.5, hr * 0.3, -hr * 1.05);
    g.fillRect(-hr * 0.7, -hr * 0.95, hr * 1.4, hr * 0.25);
  }
  // face
  const ey = -hr * 0.05;
  const ex = hr * 0.42;
  g.lineStyle(Math.max(2, u * 0.1), 0xffffff, 1);
  if (face === 'hurt') {
    for (const s of [-1, 1]) {
      g.lineBetween(s * ex - u * 0.3, ey - u * 0.3, s * ex + u * 0.3, ey + u * 0.3);
      g.lineBetween(s * ex - u * 0.3, ey + u * 0.3, s * ex + u * 0.3, ey - u * 0.3);
    }
    g.fillStyle(0x7a2230, 1).fillEllipse(0, hr * 0.55, u * 0.9, u * 0.6);
  } else {
    g.fillStyle(0xffffff, 1).fillCircle(-ex, ey, u * 0.34).fillCircle(ex, ey, u * 0.34);
    g.fillStyle(r.color, 1).fillCircle(-ex, ey + u * 0.05, u * 0.17).fillCircle(ex, ey + u * 0.05, u * 0.17);
    g.lineBetween(-ex - u * 0.4, ey - u * 0.62, -ex + u * 0.4, ey - u * 0.4);
    g.lineBetween(ex + u * 0.4, ey - u * 0.62, ex - u * 0.4, ey - u * 0.4);
    g.lineBetween(-u * 0.4, hr * 0.55, u * 0.4, hr * 0.55);
  }
}

/** ALT-07 arena: synthwave sky, sun, perspective grid floor and neon ropes. */
export function drawArena(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  g.clear();
  const hz = h * 0.5;
  for (let i = 0; i < 6; i++) g.fillStyle(0xff2fd0, 0.05).fillRect(0, hz - h * 0.08 * (i + 1), w, h * 0.08 * (i + 1));
  const sr = Math.min(w, h) * 0.22;
  g.fillStyle(0xff6a3d, 0.9).fillCircle(w / 2, hz - sr * 0.15, sr);
  g.fillStyle(0x0b0820, 1);
  for (let i = 0; i < 5; i++) g.fillRect(w / 2 - sr, hz - sr * 0.15 + i * sr * 0.18, sr * 2, sr * 0.05 + i * 1.5);
  g.fillStyle(0x0b0820, 1).fillRect(0, hz, w, h - hz);
  // glow = a wide faint stroke under a thin bright one (no shader FX: cheap on weak phones)
  for (const [lw, a] of [[6, 0.15], [2, 0.8]]) {
    g.lineStyle(lw, 0xff2fd0, a);
    for (let i = -12; i <= 12; i++) g.lineBetween(w / 2 + i * w * 0.02, hz, w / 2 + i * w * 0.18, h);
    for (let i = 1; i <= 8; i++) {
      const y = hz + (h - hz) * Math.pow(i / 8, 1.8);
      g.lineBetween(0, y, w, y);
    }
  }
  const cols = [0x2ff3ff, 0xff2fd0, 0x2ff3ff];
  for (let i = 0; i < 3; i++) {
    const y = h * (0.3 + i * 0.075);
    g.lineStyle(Math.max(8, h * 0.02), cols[i], 0.18).lineBetween(0, y, w, y);
    g.lineStyle(Math.max(2, h * 0.005), cols[i], 1).lineBetween(0, y, w, y);
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
