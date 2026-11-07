import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5184';
let usersCalls = 0;
let departmentsCalls = 0;
const apiUrls = [];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.setViewport({ width: 1280, height: 800 });
await page.evaluateOnNewDocument(() => { localStorage.setItem('token', 'ui-test-token'); localStorage.setItem('campus-theme-mode', 'dark'); });
await page.setRequestInterception(true);
page.on('request', request => {
  if (!request.url().includes('/api/')) return request.continue();
  apiUrls.push(request.url());
  let data = [];
  let total = 0;
  if (request.url().includes('/auth/me')) return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }, body: JSON.stringify({ success: true, user: { _id: 'admin-fixture', role: 'ADMIN', firstName: 'Test', lastName: 'Admin', email: 'admin@example.local', isActive: true } }) });
  if (request.url().includes('/api/users?') && request.method() === 'GET') {
    usersCalls++;
    total = 1;
    data = [{ _id: 'person-1', firstName: 'Trainee', lastName: 'User', email: 'trainee@example.local', username: 'trainee', role: 'LEARNER', isActive: true }];
  }
  if (request.url().includes('/api/departments') && request.method() === 'GET') departmentsCalls++;
  const respond = () => request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }, body: JSON.stringify({ success: true, data, total }) });
  if (request.url().includes('/api/users?') && request.method() === 'GET') return setTimeout(respond, 600);
  respond();
});
try {
  await page.goto(`${base}/students`);
  try { await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Trainee User'), { timeout: 10000 }); }
  catch (error) { throw new Error(`Directory did not render. URLs: ${apiUrls.join(', ')}. Body: ${(await page.evaluate(() => document.body.textContent)).slice(0, 500)}. Errors: ${errors.join('; ')}`, { cause: error }); }
  assert.equal(usersCalls, 1);
  assert.equal(departmentsCalls, 0, 'unused departments endpoint was fetched');
  await page.click('a[href="/calendar"]');
  await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Campus calendar'));
  await page.click('a[href="/students"]');
  await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Trainee User'));
  assert.equal(usersCalls, 1, 'repeat visit fetched an already fresh directory page');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Refresh')?.click());
  await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Trainee User'));
  await new Promise(resolve => setTimeout(resolve, 750));
  assert.equal(usersCalls, 2, 'manual refresh did not fetch current data');
  await page.goto(`${base}/calendar`);
  await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Campus calendar'));
  await page.hover('a[href="/students"]');
  await new Promise(resolve => setTimeout(resolve, 800));
  assert.equal(usersCalls, 3, 'sidebar did not warm the first directory page');
  await page.click('a[href="/students"]');
  await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Trainee User'));
  assert.equal(usersCalls, 3, 'navigation duplicated the prefetched request');
  assert.deepEqual(errors, []);
  console.log('PASS: directory caches repeat visits, prefetches once, avoids unused requests, and refreshes on demand');
} finally { await browser.close(); }
