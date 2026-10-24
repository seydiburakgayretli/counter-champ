import Phaser from 'phaser';


export const INK = 0x14141f;
const MUZZLE = 0xf5e6c8;

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
    this.cuff = scene.add.rectangle(0, 0, 10, 10, 0xf5f5f5).setStrokeStyle(4, INK);
    this.thumb = scene.add.circle(0, 0, 10, color).setStrokeStyle(4, INK);
    this.base = scene.add.circle(0, 0, 10, color).setStrokeStyle(4, INK);
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

export type Face = 'normal' | 'hurt' | 'tell';

/** ALT-09 cast: same order and difficulty as the human rivals. */
export type Species = 'bear' | 'cat' | 'rooster' | 'frog' | 'pig' | 'bunny' | 'goat' | 'lion';
export interface Animal {
  name: string;
  species: Species;
  fur: number;
  shorts: number;
}
export const ANIMALS: Animal[] = [
  { name: 'Bruno the Bear', species: 'bear', fur: 0xa0703f, shorts: 0x6fb1ff },
  { name: 'Mittens', species: 'cat', fur: 0xf2a65a, shorts: 0x7ed957 },
  { name: 'Doodle Doo', species: 'rooster', fur: 0xf5f5f5, shorts: 0xffb347 },
  { name: 'Hoppy', species: 'frog', fur: 0x6cc551, shorts: 0xb36bff },
  { name: 'Hamhock', species: 'pig', fur: 0xffb3c6, shorts: 0x4d7cff },
  { name: 'Thumper', species: 'bunny', fur: 0xdedede, shorts: 0xff5a36 },
  { name: 'Billy', species: 'goat', fur: 0xc9b79c, shorts: 0x9aa5b1 },
  { name: 'King Leo', species: 'lion', fur: 0xf2b134, shorts: 0xe63946 },
];
export const animalFor = (level: number): Animal => ANIMALS[Math.min(level, ANIMALS.length - 1)];

/** Draws an animal boxer around (0, 0) = head centre. `tell` = the wind-up face (eyes narrow, mouth open). */
export function drawFighter(g: Phaser.GameObjects.Graphics, u: number, a: Animal, face: Face): void {
  g.clear();
  g.lineStyle(4, INK, 1);
  const bw = u * 5;
  const bh = u * 4.2;
  const by = u * 2.8 - bh / 2;
  const hr = u * 1.5;
  // torso + shorts
  g.fillStyle(a.fur, 1).fillRoundedRect(-bw * 0.42, by, bw * 0.84, bh * 0.6, u * 0.5).strokeRoundedRect(-bw * 0.42, by, bw * 0.84, bh * 0.6, u * 0.5);
  g.fillStyle(a.shorts, 1).fillRoundedRect(-bw / 2, by + bh * 0.42, bw, bh * 0.58, u * 0.6).strokeRoundedRect(-bw / 2, by + bh * 0.42, bw, bh * 0.58, u * 0.6);
  // behind-the-head parts
  switch (a.species) {
    case 'bear':
      g.fillStyle(a.fur, 1).fillCircle(-hr * 0.75, -hr * 0.75, hr * 0.38).strokeCircle(-hr * 0.75, -hr * 0.75, hr * 0.38);
      g.fillCircle(hr * 0.75, -hr * 0.75, hr * 0.38).strokeCircle(hr * 0.75, -hr * 0.75, hr * 0.38);
      break;
    case 'cat':
    case 'pig':
      g.fillStyle(a.fur, 1);
      for (const s of [-1, 1]) {
        g.fillTriangle(s * hr * 0.3, -hr * 0.8, s * hr * 0.95, -hr * 0.45, s * hr * 0.85, -hr * (a.species === 'cat' ? 1.45 : 1.15));
        g.strokeTriangle(s * hr * 0.3, -hr * 0.8, s * hr * 0.95, -hr * 0.45, s * hr * 0.85, -hr * (a.species === 'cat' ? 1.45 : 1.15));
      }
      break;
    case 'bunny':
      g.fillStyle(a.fur, 1);
      for (const s of [-1, 1]) g.fillEllipse(s * hr * 0.45, -hr * 1.45, hr * 0.5, hr * 1.4).strokeEllipse(s * hr * 0.45, -hr * 1.45, hr * 0.5, hr * 1.4);
      g.fillStyle(0xffb3c6, 1).fillEllipse(-hr * 0.45, -hr * 1.45, hr * 0.22, hr * 1.0).fillEllipse(hr * 0.45, -hr * 1.45, hr * 0.22, hr * 1.0);
      break;
    case 'rooster':
      g.fillStyle(0xe63946, 1);
      for (let i = -1; i <= 1; i++) g.fillCircle(i * hr * 0.35, -hr * 1.05 - (i === 0 ? hr * 0.15 : 0), hr * 0.3).strokeCircle(i * hr * 0.35, -hr * 1.05 - (i === 0 ? hr * 0.15 : 0), hr * 0.3);
      break;
    case 'frog':
      g.fillStyle(a.fur, 1).fillCircle(-hr * 0.5, -hr * 0.75, hr * 0.42).strokeCircle(-hr * 0.5, -hr * 0.75, hr * 0.42);
      g.fillCircle(hr * 0.5, -hr * 0.75, hr * 0.42).strokeCircle(hr * 0.5, -hr * 0.75, hr * 0.42);
      break;
    case 'goat':
      g.lineStyle(Math.max(4, u * 0.25), 0x8a7a63, 1);
      for (const s of [-1, 1]) g.beginPath().arc(s * hr * 0.75, -hr * 0.9, hr * 0.45, s < 0 ? 0 : Math.PI, s < 0 ? Math.PI * 1.2 : -Math.PI * 0.2, s > 0).strokePath();
      g.lineStyle(4, INK, 1);
      break;
    case 'lion': {
      g.fillStyle(0xb5651d, 1);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        g.fillCircle(Math.cos(ang) * hr * 1.05, Math.sin(ang) * hr * 1.05, hr * 0.42);
      }
      g.fillStyle(0xffd23f, 1).fillTriangle(-hr * 0.5, -hr * 1.2, 0, -hr * 1.9, hr * 0.5, -hr * 1.2).strokeTriangle(-hr * 0.5, -hr * 1.2, 0, -hr * 1.9, hr * 0.5, -hr * 1.2);
      break;
    }
    default:
      break;
  }
  g.fillStyle(a.fur, 1).fillCircle(0, 0, hr).strokeCircle(0, 0, hr);
  // eyes (frog eyes sit on the bumps)
  const ey = a.species === 'frog' ? -hr * 0.75 : -hr * 0.1;
  const ex = hr * (a.species === 'frog' ? 0.5 : 0.4);
  g.lineStyle(Math.max(3, u * 0.12), INK, 1);
  if (face === 'hurt') {
    for (const s of [-1, 1]) {
      g.lineBetween(s * ex - u * 0.25, ey - u * 0.25, s * ex + u * 0.25, ey + u * 0.25);
      g.lineBetween(s * ex - u * 0.25, ey + u * 0.25, s * ex + u * 0.25, ey - u * 0.25);
    }
  } else if (face === 'tell') {
    for (const s of [-1, 1]) g.lineBetween(s * ex - u * 0.3, ey - u * 0.05 * s, s * ex + u * 0.3, ey + u * 0.05 * s);
  } else {
    g.fillStyle(0xffffff, 1).fillCircle(-ex, ey, u * 0.3).fillCircle(ex, ey, u * 0.3);
    g.fillStyle(INK, 1).fillCircle(-ex, ey + u * 0.04, u * 0.15).fillCircle(ex, ey + u * 0.04, u * 0.15);
  }
  // muzzle / beak / snout + mouth
  const my = hr * 0.42;
  switch (a.species) {
    case 'rooster':
      g.fillStyle(0xffb000, 1).fillTriangle(-hr * 0.25, my - hr * 0.2, hr * 0.25, my - hr * 0.2, 0, my + (face === 'tell' ? hr * 0.45 : hr * 0.25));
      g.strokeTriangle(-hr * 0.25, my - hr * 0.2, hr * 0.25, my - hr * 0.2, 0, my + (face === 'tell' ? hr * 0.45 : hr * 0.25));
      g.fillStyle(0xe63946, 1).fillEllipse(hr * 0.12, my + hr * 0.45, hr * 0.2, hr * 0.35);
      return;
    case 'pig':
      g.fillStyle(0xff8fab, 1).fillEllipse(0, my - hr * 0.05, hr * 0.7, hr * 0.45).strokeEllipse(0, my - hr * 0.05, hr * 0.7, hr * 0.45);
      g.fillStyle(INK, 1).fillCircle(-hr * 0.13, my - hr * 0.05, hr * 0.07).fillCircle(hr * 0.13, my - hr * 0.05, hr * 0.07);
      break;
    case 'bear':
    case 'lion':
    case 'goat':
      g.fillStyle(MUZZLE, 1).fillEllipse(0, my, hr * 0.8, hr * 0.55).strokeEllipse(0, my, hr * 0.8, hr * 0.55);
      g.fillStyle(INK, 1).fillEllipse(0, my - hr * 0.12, hr * 0.28, hr * 0.16);
      if (a.species === 'goat') g.fillStyle(0xf5f5f5, 1).fillTriangle(-hr * 0.15, hr * 0.85, hr * 0.15, hr * 0.85, 0, hr * 1.35);
      break;
    case 'cat':
    case 'bunny':
      g.fillStyle(0xff8fab, 1).fillTriangle(-hr * 0.1, my - hr * 0.15, hr * 0.1, my - hr * 0.15, 0, my);
      g.lineStyle(2, INK, 0.8);
      for (const s of [-1, 1]) {
        g.lineBetween(s * hr * 0.2, my, s * hr * 0.85, my - hr * 0.12);
        g.lineBetween(s * hr * 0.2, my + hr * 0.08, s * hr * 0.85, my + hr * 0.12);
      }
      g.lineStyle(Math.max(3, u * 0.12), INK, 1);
      break;
    default:
      break;
  }
  if (face === 'hurt' || face === 'tell') {
    g.fillStyle(0x7a2230, 1).fillEllipse(0, my + hr * 0.3, u * 0.7, u * (face === 'tell' ? 0.45 : 0.55));
    if (face === 'hurt') g.fillStyle(0xff6b8a, 1).fillEllipse(u * 0.15, my + hr * 0.45, u * 0.3, u * 0.35);
  } else {
    g.lineBetween(-u * 0.3, my + hr * 0.3, u * 0.3, my + hr * 0.32);
  }
}

/** Static arena: spotlight on the floor, corner posts and three ropes. */
export function drawArena(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  g.clear();
  for (let i = 0; i < 4; i++) {
    g.fillStyle(0xffffff, 0.035).fillEllipse(w / 2, h * 0.7, w * (1.05 - i * 0.2), h * (0.3 - i * 0.05));
  }
  const post = Math.max(8, w * 0.025);
  g.fillStyle(0x2c2c3e, 1).fillRect(0, h * 0.2, post, h * 0.32).fillRect(w - post, h * 0.2, post, h * 0.32);
  const cols = [0xe63946, 0xf5f5f5, 0x4d7cff];
  for (let i = 0; i < 3; i++) {
    const y = h * (0.3 + i * 0.075);
    g.lineStyle(Math.max(4, h * 0.008), INK, 1).lineBetween(0, y + 3, w, y + 3);
    g.lineStyle(Math.max(3, h * 0.006), cols[i], 1).lineBetween(0, y, w, y);
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
