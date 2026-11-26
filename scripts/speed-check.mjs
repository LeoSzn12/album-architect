// Speed check: plays the same First Week flow on two static builds (before and
// after) in a phone-sized Chrome with the CPU slowed 4x, and prints timings.
// Usage: node scripts/speed-check.mjs <before out dir> <after out dir> [report.md]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = '/album-architect';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain', '.ico': 'image/x-icon' };

function serve(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let url = decodeURIComponent(req.url.split('?')[0]);
      if (!url.startsWith(BASE)) { res.writeHead(404); return res.end(); }
      url = url.slice(BASE.length) || '/';
      let file = path.join(dir, url);
      if (!file.startsWith(path.resolve(dir))) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length * 0.95)] : null; };
const r = (n) => (n == null ? null : Math.round(n));

async function run(browser, dir, label) {
  const server = await serve(dir);
  const url = `http://127.0.0.1:${server.address().port}${BASE}/`;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  });
  await context.addInitScript(() => {
    window.__lt = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch { /* unsupported */ }
    window.__lcp = 0;
    try { new PerformanceObserver((l) => { const e = l.getEntries(); window.__lcp = e[e.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch { /* unsupported */ }
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const out = { label };
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  const start = page.getByRole('button', { name: /^Draft an? .*album/ }).first();
  await start.waitFor();
  // "Ready" = the start button responds (the page has finished starting up).
  await start.click();
  await page.getByText(/Round 1 of/).first().waitFor();
  out.readyAndStartedMs = Date.now() - t0;
  Object.assign(out, await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint');
    const js = performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'script');
    const tbt = window.__lt.reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
    return {
      firstPaintMs: Math.round(fcp ? fcp.startTime : 0),
      biggestPaintMs: Math.round(window.__lcp),
      loadEventMs: Math.round(nav.loadEventEnd),
      jsFiles: js.length,
      jsKB: Math.round(js.reduce((a, e) => a + e.decodedBodySize, 0) / 1024),
      blockedMainThreadMs: Math.round(tbt),
    };
  }));

  // Seven picks: time from tap until the next frame is drawn.
  const pickMs = [];
  for (let i = 0; i < 7; i++) {
    const ms = await page.evaluate(async () => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Pick');
      if (!btn) return null;
      const t = performance.now();
      btn.click();
      await new Promise((res) => requestAnimationFrame(() => setTimeout(res, 0)));
      return performance.now() - t;
    });
    if (ms == null) break;
    pickMs.push(ms);
    await page.waitForTimeout(700);
    if (i === 2) {
      // Scroll the draft screen for 120 frames and record frame gaps.
      Object.assign(out, await page.evaluate(async () => {
        const gaps = []; let last = performance.now();
        const H = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        for (let f = 0; f < 120; f++) {
          scrollTo(0, ((f % 60) / 60) * H);
          await new Promise((res) => requestAnimationFrame(res));
          const now = performance.now(); gaps.push(now - last); last = now;
        }
        scrollTo(0, 0);
        gaps.sort((a, b) => a - b);
        return { scrollFrameMedianMs: Math.round(gaps[60]), scrollFrameP95Ms: Math.round(gaps[114]), scrollFramesOver50ms: gaps.filter((g) => g > 50).length };
      }));
    }
  }
  out.picks = pickMs.length;
  out.pickMedianMs = r(median(pickMs));
  out.pickP95Ms = r(p95(pickMs));

  const tRelease = Date.now();
  await page.getByRole('button', { name: /Release it/ }).first().click();
  await page.getByText(/units in week one/i).first().waitFor();
  out.releaseToResultsMs = Date.now() - tRelease;

  const save = await page.evaluate(() => (localStorage.getItem('album-architect-draft-v1') || '').length);
  out.savedGameKB = Math.round(save / 1024);
  Object.assign(out, await page.evaluate(() => {
    const covers = performance.getEntriesByType('resource').filter((e) => e.name.includes('mzstatic'));
    return { covers: covers.length, coverKB: Math.round(covers.reduce((a, e) => a + (e.encodedBodySize || e.transferSize), 0) / 1024) };
  }));

  // Lazily loaded screens must still open.
  const opened = {};
  const nav = page.getByRole('navigation', { name: 'Mobile Navigation Dock' });
  try { await nav.getByRole('button', { name: /Tracks/ }).click(); await page.getByRole('dialog').first().waitFor({ timeout: 8000 }); opened.tracklist = true; await page.keyboard.press('Escape'); } catch { opened.tracklist = false; }
  try { await nav.getByRole('button', { name: /Friend/ }).click(); await page.getByRole('dialog').first().waitFor({ timeout: 8000 }); opened.friends = true; await page.keyboard.press('Escape'); } catch { opened.friends = false; }
  try { await page.getByRole('button', { name: 'How to Play' }).first().click(); await page.getByText(/Basics/).first().waitFor({ timeout: 8000 }); opened.howToPlay = true; } catch { opened.howToPlay = false; }
  out.opened = opened;

  // Reload on the results screen: the saved game must come back.
  await page.reload({ waitUntil: 'load' });
  try { await page.getByText(/units in week one/i).first().waitFor({ timeout: 15000 }); out.resultsAfterReload = true; } catch { out.resultsAfterReload = false; }

  out.pageErrors = errors.slice(0, 5);
  await context.close();
  server.close();
  return out;
}

(async () => {
  const [beforeDir, afterDir, reportPath] = process.argv.slice(2);
  const browser = await chromium.launch();
  const rounds = 3;
  const results = { before: [], after: [] };
  for (let i = 0; i < rounds; i++) {
    results.before.push(await run(browser, beforeDir, 'before'));
    results.after.push(await run(browser, afterDir, 'after'));
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  const keys = ['readyAndStartedMs', 'firstPaintMs', 'biggestPaintMs', 'loadEventMs', 'blockedMainThreadMs', 'jsFiles', 'jsKB', 'pickMedianMs', 'pickP95Ms', 'scrollFrameMedianMs', 'scrollFrameP95Ms', 'scrollFramesOver50ms', 'releaseToResultsMs', 'savedGameKB', 'covers', 'coverKB'];
  const med = (arr, k) => median(arr.map((o) => o[k]).filter((v) => typeof v === 'number'));
  let md = '## First Week speed check (phone size, CPU slowed 4x, median of 3 runs)\n\n| Measure | Before | After |\n|---|---|---|\n';
  for (const k of keys) md += `| ${k} | ${med(results.before, k)} | ${med(results.after, k)} |\n`;
  md += `\nScreens opened after the change: ${JSON.stringify(results.after.map((o) => o.opened))}\n`;
  md += `\nResults back after reload (after): ${JSON.stringify(results.after.map((o) => o.resultsAfterReload))}\n`;
  md += `\nPage errors (after): ${JSON.stringify(results.after.flatMap((o) => o.pageErrors))}\n`;
  console.log(md);
  if (reportPath) fs.writeFileSync(reportPath, md);
})().catch((e) => { console.error(e); process.exit(1); });
