import type { Platform } from './Platform';
import { LocalPlatform } from './LocalPlatform';
import { CrazyGamesPlatform } from './CrazyGamesPlatform';
import { PokiPlatform } from './PokiPlatform';

/** Build mode picks the portal: `vite build --mode crazygames|poki`; anything else is local. */
function create(): Platform {
  switch (import.meta.env.MODE) {
    case 'crazygames':
      return new CrazyGamesPlatform();
    case 'poki':
      return new PokiPlatform();
    default:
      return new LocalPlatform();
  }
}

export const platform: Platform = create();
