import puppeteer from 'puppeteer'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

// Isolated API fixtures verify UI behavior; these do not validate MongoDB.
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage()
await page.evaluateOnNewDocument(() => {
    if (!localStorage.getItem('campus-theme-mode')) localStorage.setItem('campus-theme-mode', 'light')
})
let mode = 'login'
let statsRequests = 0
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.setRequestInterception(true)
page.on('request', request => {
    if (!request.url().includes('/api/')) return request.continue()
    let body = { success: true, data: [] }
    let status = 200
    if (request.url().includes('/auth/')) body = { success: true, token: 'ui-test-token', data: { _id: 'ui-test-admin', role: 'ADMIN', firstName: 'Campus', lastName: 'Admin', email: 'admin@test.example', requiresPasswordReset: mode === 'reset' } }
    if (request.url().endsWith('/dashboard/stats')) {
        statsRequests++
        if (mode === 'error') { status = 500; body = { message: 'Fixture API unavailable' } }
        else body = { success: true, data: {
            summary: { totalUsers: mode === 'empty' ? 0 : 120, activeUsers: 100, totalBatches: 12, ongoingBatches: 8, todayAttendance: 6, recentUpdates: 24 },
            roleStats: mode === 'empty' ? [] : [{ _id: 'LEARNER', count: 100 }, { _id: 'TRAINER', count: 20 }],
            batchStats: mode === 'empty' ? [] : [{ _id: 'ONGOING', count: 8 }, { _id: 'COMPLETED', count: 4 }],
        } }
    }
    return request.respond({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }, body: JSON.stringify(body) })
})
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5174'
await mkdir('../docs/verification', { recursive: true })
try {
    await page.setViewport({ width: 1440, height: 1000 })
    await page.goto(`${base}/login`)
    await page.waitForSelector('input[type="email"]:not([disabled])')
    await page.$eval('.login-card', async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)) })
    assert.equal(await page.$eval('input[type="email"]', el => el.required), true)
    await page.screenshot({ path: '../docs/verification/login-desktop.png', fullPage: true })
    await page.setViewport({ width: 390, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile login should not overflow')
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    assert.equal(await page.$eval('.login-orbit', el => getComputedStyle(el).animationName), 'none')
    await page.screenshot({ path: '../docs/verification/login-mobile.png', fullPage: true })
    await page.setViewport({ width: 1440, height: 1100 })
    await page.goto(`${base}/signup`)
    await page.waitForSelector('[role="combobox"]')
    await page.click('[role="combobox"]')
    await page.waitForSelector('[role="option"]')
    const publicRoles = await page.$$eval('[role="option"]', options => options.map(option => option.getAttribute('data-value')))
    assert.deepEqual(publicRoles, ['LEARNER'], 'public signup must offer learner accounts only')
    await page.keyboard.press('Escape')
    await page.screenshot({ path: '../docs/verification/signup-desktop.png', fullPage: true })
    await page.setViewport({ width: 390, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile signup should not overflow')
    await page.screenshot({ path: '../docs/verification/signup-mobile.png', fullPage: true })
    await page.evaluate(() => localStorage.setItem('token', 'ui-test-token'))
    mode = 'data'
    await page.setViewport({ width: 1440, height: 1100 })
    await page.goto(`${base}/dashboard`)
    await page.waitForFunction(() => document.body.innerText.includes('Campus community'))
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.evaluate(() => document.fonts.check('500 14px "DM Sans Variable"')), true, 'bundled font must load')
    assert.match(await page.$eval('body', el => getComputedStyle(el).fontFamily), /DM Sans/)
    assert.equal(await page.$$eval('.sidebar-link .lucide', icons => icons.length > 0 && icons.every(icon => icon.getAttribute('stroke-width') === '1.7')), true)
    assert.equal(await page.$eval('.sidebar-link.is-active', el => getComputedStyle(el).display), 'flex', 'navigation icon and label must align in a row')
    const destinations = await page.$$eval('.resource-card', cards => cards.map(card => card.getAttribute('href')))
    assert.deepEqual(destinations, ['/students', '/batches', '/topics', '/trainers', '/classrooms', '/audit-logs'])
    await page.click('button[aria-label="Open account menu for Campus Admin"]')
    await page.waitForSelector('[role="menu"]')
    assert.match(await page.$eval('[role="menu"]', menu => menu.innerText), /My profile/)
    await page.keyboard.press('Escape')
    await page.waitForSelector('[role="menu"]', { hidden: true })
    assert.ok(statsRequests > 0)
    assert.ok(await page.$('svg.recharts-surface'))
    await page.screenshot({ path: '../docs/verification/dashboard-desktop.png', fullPage: true })
    await page.click('button[aria-label="Appearance: light. Change appearance"]')
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
    await page.screenshot({ path: '../docs/verification/dashboard-dark.png', fullPage: true })
    await page.reload()
    await page.waitForFunction(() => document.body.innerText.includes('Campus community'))
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), true, 'theme preference must survive reload')
    await page.setViewport({ width: 390, height: 844 })
    await page.waitForFunction(() => document.querySelector('aside')?.getBoundingClientRect().width === 80)
    await new Promise(resolve => setTimeout(resolve, 400))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile dashboard should not overflow')
    await page.screenshot({ path: '../docs/verification/dashboard-mobile.png', fullPage: true })
    await page.click('button[aria-label="Expand navigation"]')
    await page.waitForSelector('button[aria-label="Close navigation"]')
    await page.click('button[aria-label="Close navigation"]')
    await page.waitForFunction(() => document.querySelector('aside')?.getBoundingClientRect().width === 80)
    assert.equal(await page.$eval('.dashboard-view', el => getComputedStyle(el).animationName), 'none', 'reduced motion must disable dashboard entrance')
    await page.setViewport({ width: 1024, height: 1000 })
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'tablet dashboard should not overflow')
    await page.screenshot({ path: '../docs/verification/dashboard-tablet.png', fullPage: true })
    await page.setViewport({ width: 1440, height: 1100 })
    mode = 'empty'
    await page.locator('button[aria-label="Refresh overview"]').click()
    await page.waitForFunction(() => document.body.innerText.includes('No records to display yet.'))
    mode = 'error'
    await page.locator('button[aria-label="Refresh overview"]').click()
    await page.waitForFunction(() => document.body.innerText.includes('Showing the last successful snapshot.'))
    assert.match(await page.$eval('body', el => el.innerText), /last successful snapshot/)
    await page.reload()
    await page.waitForSelector('[role="alert"]')
    assert.equal(await page.$('svg.recharts-surface'), null, 'initial failure must not show invented charts')
    mode = 'reset'
    await page.goto(`${base}/login`)
    await page.waitForFunction(() => location.pathname === '/reset-password')
    await page.evaluate(() => localStorage.removeItem('token'))
    await page.goto(`${base}/login`)
    await page.waitForSelector('input[type="email"]:not([disabled])')
    await page.type('input[type="email"]', 'admin@test.example')
    await page.type('input[name="password"]', 'FixturePassword123!')
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => location.pathname === '/reset-password')
    assert.deepEqual(errors, [])
    console.log('PASS: bundled font, outline icons, light/dark theme persistence, desktop/tablet/mobile layouts, navigation, login/signup, reduced motion, charts, empty/error states and reset routing; API fixtures used.')
} finally { await browser.close() }
