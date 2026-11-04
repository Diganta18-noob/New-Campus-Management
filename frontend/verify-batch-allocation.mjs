import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluateOnNewDocument(() => localStorage.setItem('token', 'fixture'));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (!request.url().includes('/api/')) return request.continue();
    let data = [];
    if (request.url().includes('/auth/me')) data = { _id: 'admin', role: 'ADMIN', firstName: 'Test', lastName: 'Admin' };
    if (request.url().includes('/allocation-preview')) data = { issues: [{ code: 'CAPACITY_EXCEEDED', field: 'learners', message: 'Classroom capacity is 1; 2 learners selected' }], capacity: { seats: 1, enrolled: 2 } };
    request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }, body: JSON.stringify({ success: true, data, total: 0 }) });
  });
  const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5184';
  await page.setViewport({ width: 320, height: 740 });
  await page.goto(`${base}/batches`);
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('Add Batch')));
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Add Batch')).click());
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('Check allocation')));
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Check allocation')).click());
  await page.waitForFunction(() => document.body.innerText.includes('Classroom capacity is 1'));
  assert.deepEqual(errors, []);
  console.log('PASS: mobile batch allocation preview displays capacity and field issue');
} finally { await browser.close(); }
