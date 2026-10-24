// Headless smoke test: load -> start -> land counters -> lose on purpose -> game over -> restart < 1 s.
// Usage: npm run build && node tests/smoke.cjs   (needs a global Playwright; starts vite preview itself)
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const PORT = 4173;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (msg) => { console.error('SMOKE FAIL:', msg); process.exitCode = 1; };

(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  const browser = await chromium.launch();
  try {
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* not up yet */ }
      await sleep(250);
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`http://localhost:${PORT}/`);
    const snap = () => page.evaluate(() => ({ ...window.__cc }));
    await page.waitForFunction(() => window.__cc && window.__cc.state === 'title', null, { timeout: 10000 });

    await page.keyboard.press('Space');                       // first input starts the run
    await page.waitForFunction(() => window.__cc.state === 'idle');

    // land perfect counters until the first KO (score must rise)
    const until = Date.now() + 20000;
    while (Date.now() < until) {
      const s = await snap();
      if (s.level >= 1 && s.state === 'idle') break;
      if (s.state === 'threat' && !s.feint && s.msToImpact <= 12) await page.keyboard.press('Space');
      await sleep(4);
    }
    const afterKo = await snap();
    if (afterKo.level < 1) fail(`never reached opponent 2: ${JSON.stringify(afterKo)}`);
    if (afterKo.score <= 0) fail(`no score after counters: ${JSON.stringify(afterKo)}`);

    // touch input on the right half must be accepted too
    await page.touchscreen.tap(300, 400);

    // rotate to landscape mid-run and back: layout follows, page never scrolls
    for (const [w, h] of [[780, 390], [390, 780]]) {
      await page.setViewportSize({ width: w, height: h });
      await sleep(200);
      const dims = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight,
        document.querySelector('canvas').width, document.querySelector('canvas').height]);
      if (dims[0] > w || dims[1] > h || dims[2] !== w || dims[3] !== h) fail(`bad layout at ${w}x${h}: ${dims}`);
    }

    // stop playing -> hearts drop -> game over
    await page.waitForFunction(() => window.__cc.state === 'over', null, { timeout: 60000 });
    const over = await snap();
    console.log('game over reached:', JSON.stringify(over));

    await sleep(650);                                          // retry lock (game time, + hit-stop, + slow headless frames)
    const t0 = Date.now();
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => window.__cc.state === 'idle', null, { timeout: 1000 });
    console.log(`restart took ${Date.now() - t0} ms`);

    // progress survives reload: first KO unlocked the 2nd gloves and they stay equipped
    await page.reload();
    await page.waitForFunction(() => window.__cc && window.__cc.state === 'title', null, { timeout: 10000 });
    const saved = await page.evaluate(() => localStorage.getItem('cc.save'));
    const glove = await page.evaluate(() => window.__cc.glove);
    console.log('after reload:', saved, 'glove', glove);
    if (glove < 1) fail(`unlock lost after reload: ${saved}`);

    if (errors.length) fail(`console errors:\n${errors.join('\n')}`);
    else if (!process.exitCode) console.log('SMOKE OK');
  } catch (e) {
    fail(String(e));
  } finally {
    await browser.close();
    server.kill();
  }
})();
