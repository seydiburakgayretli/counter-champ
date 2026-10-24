/** Single portal interface. Implementations: local, crazygames, poki (selected by build mode). */
export interface Platform {
  init(): Promise<void>;
  loadingStart(): void;
  loadingFinished(): void;
  /** Fire on first player input of a run, never on load. Never twice in a row. */
  gameplayStart(): void;
  /** Fire on pause, menu and game over. Never twice in a row. */
  gameplayStop(): void;
  /** Interstitial at a natural break. Resolves when the game may continue. */
  commercialBreak(): Promise<void>;
  /** Rewarded ad. Resolves true if the reward should be granted. */
  rewardedBreak(): Promise<boolean>;
  save(key: string, value: string): void;
  load(key: string): string | null;
}
