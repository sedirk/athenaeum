// Run against a local Vite server. NODE_PATH may point to a bundled Playwright.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 1200, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = 'http://127.0.0.1:1420/tests/i18n/';
    await page.goto(url);
    await page.getByRole('heading', { name: '文件管理' }).waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
    await page.getByText('校准帧库 — 尚未设置').waitFor();
    await page.getByText('原始科学帧＋原始校准帧', { exact: true }).waitFor();
    assert.equal(await page.getByTestId('count').innerText(), '磁盘上缺少 2 个文件');
    assert.equal(await page.getByTestId('fallback').innerText(), 'Unknown upstream text');
    assert.equal(await page.getByTestId('literal').innerText(), '位于 D:\\M45 $& {count} 内');
    await page.getByRole('button', { name: '设置…', exact: true }).click();
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await page.getByRole('button', { name: 'Navigate', exact: true }).click();
    await page.getByTestId('route').filter({ hasText: /^\/second$/ }).waitFor();
    await page.getByRole('button', { name: '后退', exact: true }).click();
    await page.getByTestId('route').filter({ hasText: /^\/$/ }).waitFor();
    assert.equal(await page.getByTestId('route').innerText(), '/');
    await page.getByRole('button', { name: '前进', exact: true }).click();
    await page.getByTestId('route').filter({ hasText: /^\/second$/ }).waitFor();
    assert.equal(await page.getByTestId('route').innerText(), '/second');
    const out = process.env.I18N_SCREENSHOT_DIR;
    if (out) { fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: path.join(out, 'zh-CN.png'), fullPage: true }); }
    await page.getByRole('combobox', { name: 'Language' }).selectOption('en');
    await page.getByRole('heading', { name: 'File Manager' }).waitFor();
    await page.getByText('Calibration Library — Not configured').waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.getByTestId('count').innerText(), '2 files missing from disk');
    await page.reload();
    await page.getByRole('heading', { name: 'File Manager' }).waitFor();
    if (out) await page.screenshot({ path: path.join(out, 'en.png'), fullPage: true });
    await page.getByRole('combobox', { name: 'Language' }).selectOption('zh-CN');
    await page.reload();
    await page.getByRole('heading', { name: '文件管理' }).waitFor();
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS: Chinese auto-detection, English fallback, live switching, persistence, placeholders, dialogs and upstream back/forward navigation.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
