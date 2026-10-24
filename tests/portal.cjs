// Portal adapter test with mocked SDKs: checks event order (no double start/stop) and the rewarded continue.
// Usage: node tests/portal.cjs crazygames|poki   (builds into dist-<mode>, serves it, needs a global Playwright)
const { spawnSync, spawn } = require('child_process');
const { chromium } = require('playwright');

const mode = process.argv[2];
const PORT = mode === 'poki' ? 4182 : 4181;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (m) => { console.error('PORTAL FAIL:', m); process.exitCode = 1; };

const MOCKS = {
  crazygames: ['sdk.crazygames.com', `window.__log=[];const L=(n)=>window.__log.push(n);
    window.CrazyGames={SDK:{init:async()=>L('init'),game:{loadingStart:()=>L('loadingStart'),loadingStop:()=>L('loadingStop'),
    gameplayStart:()=>L('gameplayStart'),gameplayStop:()=>L('gameplayStop')},
    ad:{requestAd:(t,cb)=>{L('ad:'+t);setTimeout(()=>cb.adFinished(),50);}}}};`],
  poki: ['game-cdn.poki.com', `window.__log=[];const L=(n)=>window.__log.push(n);
    window.PokiSDK={init:async()=>L('init'),gameLoadingFinished:()=>L('loadingFinished'),gameplayStart:()=>L('gameplayStart'),
    gameplayStop:()=>L('gameplayStop'),commercialBreak:async()=>{L('commercialBreak');},rewardedBreak:async()=>{L('rewardedBreak');return true;}};`],
};

(async () => {
  if (!MOCKS[mode]) return fail('mode must be crazygames or poki');
  const out = `dist-${mode}`;
  const b = spawnSync('npx', ['vite', 'build', '--mode', mode, '--outDir', out], { stdio: 'ignore' });
  if (b.status !== 0) return fail('build failed');
  const server = spawn('npx', ['vite', 'preview', '--outDir', out, '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
  const browser = await chromium.launch();
  try {
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* not up yet */ }
      await sleep(250);
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 780 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', (r) => { if (process.env.DBG) console.log('req', r.url()); });
    await page.route(new RegExp(MOCKS[mode][0].replace(/\./g, '\\.')), (r) => r.fulfill({ contentType: 'text/javascript', body: MOCKS[mode][1] }));
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForFunction(() => window.__cc && window.__cc.state === 'title', null, { timeout: 10000 });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__cc.state === 'over', null, { timeout: 60000 });
    await sleep(650);
    await page.keyboard.press('ArrowRight');                    // rewarded continue
    await page.waitForFunction(() => window.__cc.state === 'idle', null, { timeout: 3000 });
    await page.waitForFunction(() => window.__cc.state === 'over', null, { timeout: 60000 });
    const log = await page.evaluate(() => window.__log);
    console.log(mode, 'events:', log.join(' '));
    const flow = log.filter((e) => e === 'gameplayStart' || e === 'gameplayStop');
    flow.forEach((e, i) => { if (i > 0 && flow[i - 1] === e) fail(`double ${e}`); });
    if (flow[0] !== 'gameplayStart') fail('first flow event is not gameplayStart');
    if (!log.some((e) => e.startsWith('ad:rewarded') || e === 'rewardedBreak')) fail('no rewarded call');
    if (errors.length) fail(`console errors: ${errors.join(' | ')}`);
    if (!process.exitCode) console.log('PORTAL OK');
  } catch (e) {
    fail(String(e));
  } finally {
    await browser.close();
    process.kill(-server.pid);
  }
})();
