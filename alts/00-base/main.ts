import { BasePlatform } from '../../src/platform/BasePlatform';

// Reference alternative: the unchanged main game with its own save slot. Copy this folder to start an alt.
BasePlatform.namespace = 'cc.alt00.';
void import('../../src/main');
