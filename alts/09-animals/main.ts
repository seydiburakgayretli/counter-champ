import Phaser from 'phaser';
import { BasePlatform } from '../../src/platform/BasePlatform';
import { BootScene } from '../../src/scenes/BootScene';
import { GameScene } from './GameScene';

// ALT-09 Animal Boxers: cartoon animal cast with wind-up tell faces.
BasePlatform.namespace = 'cc.alt09.';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1b1d2b',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, GameScene],
});
