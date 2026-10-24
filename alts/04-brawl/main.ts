import Phaser from 'phaser';
import { BasePlatform } from '../../src/platform/BasePlatform';
import { BootScene } from '../../src/scenes/BootScene';
import { BrawlScene } from './BrawlScene';

// ALT-04 Four-Way Brawl: small brawlers from 4 sides, tap their quadrant (or arrows/WASD) as they arrive.
BasePlatform.namespace = 'cc.alt04.';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#3b2f5c',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, BrawlScene],
});
