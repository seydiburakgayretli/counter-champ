import Phaser from 'phaser';

const FONT = 'system-ui, sans-serif';
/** Crisp text on hi-DPI phones; capped at 2 to keep texture memory small. */
export const TEXT_RES = Math.min(2, window.devicePixelRatio || 1);
const N_PARTICLES = 32;
const N_POPUPS = 6;

/** Pooled star particles. Nothing is allocated after construction. */
export class Particles {
  private readonly stars: Phaser.GameObjects.Star[] = [];
  private readonly vx = new Float32Array(N_PARTICLES);
  private readonly vy = new Float32Array(N_PARTICLES);
  private readonly age = new Float32Array(N_PARTICLES);
  private readonly life = new Float32Array(N_PARTICLES);
  private readonly size = new Float32Array(N_PARTICLES);
  private readonly spin = new Float32Array(N_PARTICLES);
  private next = 0;
  private u = 40;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < N_PARTICLES; i++) {
      this.stars.push(scene.add.star(0, 0, 5, 4, 10, 0xffffff).setVisible(false));
      this.life[i] = 0;
    }
  }

  setUnit(u: number): void {
    this.u = u;
  }

  /** Radial burst of stars; `speed` is in units (u) per second. */
  burst(x: number, y: number, color: number, count: number, speed: number, sizeU: number): void {
    for (let n = 0; n < count; n++) {
      const i = this.next;
      this.next = (this.next + 1) % N_PARTICLES;
      const a = Math.random() * Math.PI * 2;
      const v = this.u * speed * (0.45 + Math.random() * 0.75);
      this.vx[i] = Math.cos(a) * v;
      this.vy[i] = Math.sin(a) * v - this.u * speed * 0.25;
      this.age[i] = 0;
      this.life[i] = 380 + Math.random() * 280;
      this.size[i] = (this.u * sizeU * (0.6 + Math.random() * 0.8)) / 10;
      this.spin[i] = (Math.random() - 0.5) * 12;
      this.stars[i].setPosition(x, y).setFillStyle(color).setScale(this.size[i]).setAlpha(1).setRotation(Math.random() * 6).setVisible(true);
    }
  }

  update(dt: number): void {
    const s = dt / 1000;
    for (let i = 0; i < N_PARTICLES; i++) {
      if (this.life[i] <= 0) continue;
      this.age[i] += dt;
      const k = this.age[i] / this.life[i];
      const st = this.stars[i];
      if (k >= 1) {
        this.life[i] = 0;
        st.setVisible(false);
        continue;
      }
      this.vy[i] += this.u * 14 * s;
      st.x += this.vx[i] * s;
      st.y += this.vy[i] * s;
      st.rotation += this.spin[i] * s;
      st.setScale(this.size[i] * (1 - k * 0.6)).setAlpha(1 - k * k);
    }
  }
}

/** Pooled floating text (judgement words, +score, POW). */
export class Popups {
  private readonly texts: Phaser.GameObjects.Text[] = [];
  private readonly age = new Float32Array(N_POPUPS);
  private readonly life = new Float32Array(N_POPUPS);
  private readonly y0 = new Float32Array(N_POPUPS);
  private readonly rise = new Float32Array(N_POPUPS);
  private next = 0;
  private u = 40;
  private fs = 24;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < N_POPUPS; i++) {
      this.texts.push(
        scene.add.text(0, 0, '', { fontFamily: FONT, fontStyle: '800', color: '#ffffff', stroke: '#14141f', strokeThickness: 5, align: 'center', resolution: TEXT_RES })
          .setOrigin(0.5).setVisible(false),
      );
    }
  }

  setUnit(u: number, fs: number): void {
    this.u = u;
    this.fs = fs;
  }

  spawn(text: string, color: string, x: number, y: number, sizeMul: number, lifeMs: number): void {
    const i = this.next;
    this.next = (this.next + 1) % N_POPUPS;
    this.age[i] = 0;
    this.life[i] = lifeMs;
    this.y0[i] = y;
    this.rise[i] = this.u * 0.9;
    this.texts[i].setText(text).setColor(color).setFontSize(Math.round(this.fs * sizeMul)).setPosition(x, y).setScale(0.5).setAlpha(1).setVisible(true);
  }

  update(dt: number): void {
    for (let i = 0; i < N_POPUPS; i++) {
      if (this.life[i] <= 0) continue;
      this.age[i] += dt;
      const t = this.texts[i];
      const k = this.age[i] / this.life[i];
      if (k >= 1) {
        this.life[i] = 0;
        t.setVisible(false);
        continue;
      }
      const pop = this.age[i] < 140 ? 0.5 + (this.age[i] / 140) * 0.75 : 1.25 - Math.min(0.25, (this.age[i] - 140) / 400);
      t.setScale(pop).setY(this.y0[i] - this.rise[i] * k).setAlpha(k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4);
    }
  }
}
