import { BasePlatform } from './BasePlatform';

/** Dev/GitHub Pages platform: logs events, fake 1 s ad overlay, localStorage saves. */
export class LocalPlatform extends BasePlatform {
  async init(): Promise<void> {
    console.log('[platform] local init');
  }

  loadingStart(): void {
    console.log('[platform] loadingStart');
  }

  loadingFinished(): void {
    console.log('[platform] loadingFinished');
  }

  protected onGameplayStart(): void {
    console.log('[platform] gameplayStart');
  }

  protected onGameplayStop(): void {
    console.log('[platform] gameplayStop');
  }

  async commercialBreak(): Promise<void> {
    console.log('[platform] commercialBreak (fake)');
    await this.fakeAd('AD');
  }

  async rewardedBreak(): Promise<boolean> {
    console.log('[platform] rewardedBreak (fake)');
    await this.fakeAd('REWARDED AD');
    return true;
  }

  private fakeAd(label: string): Promise<void> {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.textContent = `${label} (fake)`;
      el.style.cssText =
        'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000c;color:#fff;font:700 24px sans-serif;z-index:10';
      document.body.appendChild(el);
      window.setTimeout(() => {
        el.remove();
        resolve();
      }, 1000);
    });
  }
}
