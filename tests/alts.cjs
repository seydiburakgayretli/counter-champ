// Alternatives smoke: /alts/ index lists every alt; each alt loads, starts on first input and reaches
// game over (idle player) without console errors. Contract: alts expose window.__cc.state like the game.
// Usage: npm run build && node tests/alts.cjs [nn-slug]   (needs a global Playwright; starts vite preview itself)
const { spawn } = require('child_process');
const fs = require('fs');
const { chromium } = require('playwright');

const PORT = 4175;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (msg) => { console.error('ALTS FAIL:', msg); process.exitCode = 1; };
const only = process.argv[2];
const ids = fs.readdirSync('alts', { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(`alts/${d.name}/index.html`) && (!only || d.name === only))
  .map((d) => d.name);

async function checkAlt(browser, id) {
  const page = await browser.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(`http://localhost:${PORT}/alts/${id}/`);
    await page.waitForFunction(() => window.__cc && window.__cc.state === 'title', null, { timeout: 15000 });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__cc.state !== 'title', null, { timeout: 3000 });
    await page.waitForFunction(() => window.__cc.state === 'over', null, { timeout: 120000 });
    if (errors.length) fail(`${id}: console errors: ${errors.join(' | ')}`);
    else console.log(`${id}: ok`);
  } catch (e) {
    fail(`${id}: ${String(e).split('\n')[0]}`);
  } finally {
    await page.close();
  }
}

(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
  const browser = await chromium.launch();
  try {
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch(`http://localhost:${PORT}/alts/`)).ok) break; } catch { /* not up yet */ }
      await sleep(250);
    }
    const index = await browser.newPage();
    await index.goto(`http://localhost:${PORT}/alts/`);
    const links = await index.$$eval('a.card', (as) => as.map((a) => a.getAttribute('href')));
    for (const id of ids) if (!links.includes(`./${id}/`)) fail(`${id} missing from alts/list.ts`);
    await index.close();
    // 2 at a time: the software renderer slows every page down, and game time is capped per frame
    for (let i = 0; i < ids.length; i += 2) await Promise.all(ids.slice(i, i + 2).map((id) => checkAlt(browser, id)));
    if (!process.exitCode) console.log(`ALTS OK (${ids.length})`);
  } finally {
    await browser.close();
    process.kill(-server.pid);
  }
})();
