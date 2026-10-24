import Phaser from 'phaser';
import { BasePlatform } from '../../src/platform/BasePlatform';
import { BootScene } from '../../src/scenes/BootScene';
import { GameScene } from './GameScene';

// ALT-07 Neon Night: synthwave art direction – dark fills, neon outlines, glow FX.
BasePlatform.namespace = 'cc.alt07.';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b0820',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, GameScene],
});
