import { BasePlatform } from './BasePlatform';

interface PokiSdk {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(onStart?: () => void): Promise<boolean>;
}

declare global {
  interface Window {
    PokiSDK?: PokiSdk;
  }
}

const SDK_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

/** Poki SDK v2. Poki resolves breaks immediately when ads are blocked, so the game never stalls. */
export class PokiPlatform extends BasePlatform {
  private sdk: PokiSdk | null = null;

  async init(): Promise<void> {
    if (!(await this.loadScript(SDK_URL))) return;
    const sdk = window.PokiSDK;
    if (!sdk) return;
    try {
      await sdk.init();
    } catch {
      /* Poki rejects init when ads are blocked; the SDK stays usable */
    }
    this.sdk = sdk;
  }

  loadingFinished(): void {
    this.sdk?.gameLoadingFinished();
  }

  protected onGameplayStart(): void {
    this.sdk?.gameplayStart();
  }

  protected onGameplayStop(): void {
    this.sdk?.gameplayStop();
  }

  async commercialBreak(): Promise<void> {
    try {
      await this.sdk?.commercialBreak();
    } catch {
      /* continue without ad */
    }
  }

  async rewardedBreak(): Promise<boolean> {
    try {
      return (await this.sdk?.rewardedBreak()) === true;
    } catch {
      return false;
    }
  }
}
