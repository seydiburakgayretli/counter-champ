import type { Platform } from './Platform';

/** Shared behaviour: gameplay start/stop order guard, localStorage saves, SDK script loader. */
export abstract class BasePlatform implements Platform {
  /** Save key prefix; alternatives (alts/) set their own so they never touch the main game's save. */
  static namespace = 'cc.';
  private playing = false;

  abstract init(): Promise<void>;
  abstract commercialBreak(): Promise<void>;
  abstract rewardedBreak(): Promise<boolean>;

  loadingStart(): void {}
  loadingFinished(): void {}

  gameplayStart(): void {
    if (this.playing) return;
    this.playing = true;
    this.onGameplayStart();
  }

  gameplayStop(): void {
    if (!this.playing) return;
    this.playing = false;
    this.onGameplayStop();
  }

  protected onGameplayStart(): void {}
  protected onGameplayStop(): void {}

  save(key: string, value: string): void {
    try {
      localStorage.setItem(`${BasePlatform.namespace}${key}`, value);
    } catch {
      /* storage blocked: ignore */
    }
  }

  load(key: string): string | null {
    try {
      return localStorage.getItem(`${BasePlatform.namespace}${key}`);
    } catch {
      return null;
    }
  }

  /** Loads a portal SDK script; resolves false on failure or timeout (ad blockers) so the game still starts. */
  protected loadScript(src: string, timeoutMs = 4000): Promise<boolean> {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      const timer = window.setTimeout(() => resolve(false), timeoutMs);
      s.src = src;
      s.onload = () => {
        window.clearTimeout(timer);
        resolve(true);
      };
      s.onerror = () => {
        window.clearTimeout(timer);
        resolve(false);
      };
      document.head.appendChild(s);
    });
  }
}
