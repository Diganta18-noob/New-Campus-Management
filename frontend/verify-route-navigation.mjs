import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5184';
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.evaluateOnNewDocument(() => { localStorage.setItem('token', 'ui-test-token'); localStorage.setItem('campus-theme-mode', 'dark'); });
await page.setRequestInterception(true);
page.on('request', request => {
  if (request.url().includes('/api/')) {
    const data = request.url().includes('/auth/me')
      ? { _id: 'admin-fixture', role: 'ADMIN', firstName: 'Test', lastName: 'Admin', email: 'admin@example.local', isActive: true, requiresPasswordReset: false }
      : [];
    return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' }, body: JSON.stringify({ success: true, data, total: 0 }) });
  }
  if (/\/assets\/Assessments-[^/]+\.js/.test(request.url())) {
    return setTimeout(() => request.continue(), 3000);
  }
  request.continue();
});
try {
  await page.goto(`${base}/students`);
  await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Users Management'));
  await page.click('a[href="/assessments"]');
  await page.waitForFunction(() => location.pathname === '/assessments');
  await new Promise(resolve => setTimeout(resolve, 400));
  const state = await page.evaluate(() => ({ content: document.querySelector('main')?.textContent || '', breadcrumb: document.querySelector('.workspace-breadcrumbs')?.textContent || '', active: document.querySelector('a[href="/assessments"]')?.getAttribute('aria-current') }));
  assert.equal(state.content.includes('Users Management'), false, 'previous route remains visible after URL changes');
  assert.match(state.content, /Loading assessments|Assessments & results/);
  assert.match(state.breadcrumb, /Assessments/);
  assert.equal(state.active, 'page');
  await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Assessments & results'));
  assert.deepEqual(errors, []);
  console.log('PASS: delayed route chunk shows matching loading state, then renders destination');
} finally {
  await browser.close();
}
