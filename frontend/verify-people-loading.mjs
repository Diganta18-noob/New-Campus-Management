import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  const errors = []; const spreadsheetRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluateOnNewDocument(() => localStorage.setItem('token', 'fixture'));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (/\/xlsx[^/]*\.js/.test(request.url())) spreadsheetRequests.push(request.url());
    if (!request.url().includes('/api/')) return request.continue();
    const data = request.url().includes('/auth/me') ? { _id: 'admin', role: 'ADMIN', firstName: 'Test', lastName: 'Admin' } : [];
    request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' }, body: JSON.stringify({ success: true, data }) });
  });
  await page.goto(`${process.env.UI_TEST_URL || 'http://127.0.0.1:5184'}/students`);
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('Download Template')));
  assert.equal(spreadsheetRequests.length, 0, 'Spreadsheet code must not load on directory entry');
  await Promise.all([
    page.waitForResponse(response => /\/xlsx[^/]*\.js/.test(response.url()) && response.status() === 200),
    page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Download Template')).click()),
  ]);
  assert.equal(spreadsheetRequests.length, 1);
  assert.deepEqual(errors, []);
  console.log('PASS: people directory loads without Excel code; template action fetches the spreadsheet chunk');
} finally { await browser.close(); }
