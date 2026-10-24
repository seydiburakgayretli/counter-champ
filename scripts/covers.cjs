// Renders store covers from the real game (a PERFECT counter moment + title) into release-assets/covers/.
// Usage: npm run build && node scripts/covers.cjs   (sizes: CrazyGames covers + 512 icon; verify current spec)
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const PORT = 4190;
const SIZES = [
  ['landscape_1920x1080', 960, 540, 2],
  ['portrait_800x1200', 400, 600, 2],
  ['square_800x800', 400, 400, 2],
  ['icon_512x512', 256, 256, 2],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
  const browser = await chromium.launch();
  try {
    await sleep(2500);
    for (const [name, w, h, dpr] of SIZES) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
      await page.goto(`http://localhost:${PORT}/`);
      await page.waitForFunction(() => window.__cc && window.__cc.state === 'title');
      await page.keyboard.press('Space');
      // land two perfect counters so the combo pop-up and stars are on screen
      for (let hits = 0; hits < 2;) {
        const s = await page.evaluate(() => ({ ...window.__cc }));
        if (s.state === 'threat' && !s.feint && s.msToImpact <= 12) {
          await page.keyboard.press('Space');
          const after = await page.evaluate(() => window.__cc.score);
          if (after >= s.score + 100) hits++;                  // count only perfect counters
          await sleep(hits < 2 ? 300 : 40);
        } else await sleep(4);
      }
      // title band hides the HUD; one line, sized to the width
      await page.evaluate((w) => {
        const d = document.createElement('div');
        d.textContent = 'COUNTER CHAMP';
        d.style.cssText = 'position:fixed;left:0;right:0;top:0;height:22%;display:flex;align-items:center;justify-content:center;' +
          'background:linear-gradient(#1b1d2b 75%, rgba(27,29,43,0));pointer-events:none;' +
          `font:900 ${Math.min(80, Math.floor(w / 9.3))}px system-ui,sans-serif;color:#ffd23f;` +
          '-webkit-text-stroke:3px #14141f;paint-order:stroke;text-shadow:0 4px 0 #e63946;white-space:nowrap';
        document.body.appendChild(d);
      }, w);
      await page.screenshot({ path: `release-assets/covers/${name}.png` });
      console.log('wrote', name);
      await page.close();
    }
  } finally {
    await browser.close();
    process.kill(-server.pid);
  }
})();
