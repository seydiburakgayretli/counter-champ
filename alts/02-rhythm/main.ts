import Phaser from 'phaser';
import { BasePlatform } from '../../src/platform/BasePlatform';
import { BootScene } from '../../src/scenes/BootScene';
import { GameScene } from './GameScene';

// ALT-02 Rhythm Fighter: a generated beat; every punch lands on it, tempo rises per rival.
BasePlatform.namespace = 'cc.alt02.';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1b1d2b',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, GameScene],
});
