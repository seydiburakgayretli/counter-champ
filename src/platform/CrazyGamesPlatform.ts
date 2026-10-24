import { BasePlatform } from './BasePlatform';

interface AdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

interface CrazySdk {
  init(): Promise<void>;
  game: {
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
  };
  ad: { requestAd(type: 'midgame' | 'rewarded', cb: AdCallbacks): void };
  /** Cloud-synced storage with the localStorage API (progress follows the player's account). */
  data?: { getItem(key: string): string | null; setItem(key: string, value: string): void };
}

declare global {
  interface Window {
    CrazyGames?: { SDK: CrazySdk };
  }
}

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

/** CrazyGames SDK v3. Every call is guarded: if the SDK is blocked or fails, the game runs without ads. */
export class CrazyGamesPlatform extends BasePlatform {
  private sdk: CrazySdk | null = null;

  async init(): Promise<void> {
    if (!(await this.loadScript(SDK_URL))) return;
    try {
      const sdk = window.CrazyGames?.SDK;
      if (!sdk) return;
      await sdk.init();
      this.sdk = sdk;
    } catch {
      this.sdk = null;
    }
  }

  save(key: string, value: string): void {
    super.save(key, value);
    try {
      this.sdk?.data?.setItem(`cc.${key}`, value);
    } catch {
      /* local copy above is enough */
    }
  }

  load(key: string): string | null {
    try {
      const v = this.sdk?.data?.getItem(`cc.${key}`);
      if (v !== null && v !== undefined) return v;
    } catch {
      /* fall back to the local copy */
    }
    return super.load(key);
  }

  loadingStart(): void {
    this.sdk?.game.loadingStart();
  }

  loadingFinished(): void {
    this.sdk?.game.loadingStop();
  }

  protected onGameplayStart(): void {
    this.sdk?.game.gameplayStart();
  }

  protected onGameplayStop(): void {
    this.sdk?.game.gameplayStop();
  }

  async commercialBreak(): Promise<void> {
    await this.requestAd('midgame');
  }

  rewardedBreak(): Promise<boolean> {
    return this.requestAd('rewarded');
  }

  /** Resolves true only when the ad ran to the end (reward granted for rewarded ads). */
  private requestAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    const sdk = this.sdk;
    if (!sdk) return Promise.resolve(false);
    return new Promise((resolve) => {
      try {
        sdk.ad.requestAd(type, {
          adFinished: () => resolve(true),
          adError: () => resolve(false),
        });
      } catch {
        resolve(false);
      }
    });
  }
}
