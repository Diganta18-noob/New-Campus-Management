import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5184';
const errors = [];
async function visit(role, width, routes) {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({ width, height: 800 });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('token', 'ui-test-token'); localStorage.setItem('campus-theme-mode', 'light'); });
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (!request.url().includes('/api/')) return request.continue();
    let data = [];
    if (request.url().includes('/auth/me')) data = { _id: `${role}-fixture`, role, firstName: 'Test', lastName: role, email: 'test@example.local', isActive: true, requiresPasswordReset: false };
    if (request.url().includes('/settings/me')) data = { announcements: true, calendar: true };
    if (request.url().endsWith('/settings')) data = { name: 'Test Campus', retentionDays: 365, contactEmail: '', timeZone: 'UTC' };
    request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS' }, body: JSON.stringify({ success: true, data, total: 0, unread: 0 }) });
  });
  try {
    for (const [route, heading] of routes) {
      await page.goto(`${base}${route}`);
      await page.waitForFunction(expected => document.querySelector('h4')?.textContent.includes(expected), {}, heading);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${role} ${route} overflows at ${width}px`);
    }
  } finally { await page.close(); }
}
try {
  await visit('ADMIN', 320, [['/calendar', 'Campus calendar'], ['/assessments', 'Assessments'], ['/course-progress', 'Course progress'], ['/support', 'Learner support'], ['/enrollments', 'Enrollment'], ['/institution-settings', 'Institution settings']]);
  await visit('LEARNER', 390, [['/calendar', 'Campus calendar'], ['/assessments', 'Assessments'], ['/course-progress', 'Course progress'], ['/support', 'Learner support'], ['/enrollments', 'Enrollment']]);
  await visit('TRAINER', 1024, [['/calendar', 'Campus calendar'], ['/assessments', 'Assessments'], ['/course-progress', 'Course progress'], ['/support', 'Learner support']]);
  assert.deepEqual(errors, []);
  console.log('PASS: academic pages render without overflow or browser errors for admin, learner and trainer');
} finally { await browser.close(); }
