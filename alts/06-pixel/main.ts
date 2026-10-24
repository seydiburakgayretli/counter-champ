import Phaser from 'phaser';
import { BasePlatform } from '../../src/platform/BasePlatform';
import { BootScene } from '../../src/scenes/BootScene';
import { GameScene } from './GameScene';

// ALT-06 Pixel Retro: same game rendered at 1/3 resolution and zoomed ×3 with hard pixels, square-wave SFX.
BasePlatform.namespace = 'cc.alt06.';

const PX = 3;
const size = (): [number, number] => [Math.ceil(window.innerWidth / PX), Math.ceil(window.innerHeight / PX)];
const [w, h] = size();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  pixelArt: true,
  backgroundColor: '#1b1d2b',
  scale: { mode: Phaser.Scale.NONE, width: w, height: h, zoom: PX },
  scene: [BootScene, GameScene],
});
window.addEventListener('resize', () => {
  const [nw, nh] = size();
  game.scale.resize(nw, nh);
});
