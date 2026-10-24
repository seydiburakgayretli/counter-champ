import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/** Pages/dev builds also ship the alternatives in alts/<nn-slug>/; portal builds ship only the game. */
function altInputs(): Record<string, string> {
  const inputs: Record<string, string> = { alts: resolve(__dirname, 'alts/index.html') };
  for (const d of readdirSync(resolve(__dirname, 'alts'), { withFileTypes: true })) {
    const html = resolve(__dirname, 'alts', d.name, 'index.html');
    if (d.isDirectory() && existsSync(html)) inputs[`alt-${d.name}`] = html;
  }
  return inputs;
}

// Relative base so the same build works on GitHub Pages and inside portal iframes.
export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...(mode === 'crazygames' || mode === 'poki' ? {} : altInputs()),
      },
    },
  },
}));
