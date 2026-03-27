const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log("Launching browser to test file upload...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/users');
    
    // We might need to login because of AuthGuard
    // Let's use localStorage injection if we can, or just log in
    // Wait for the login page if redirected
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes('login') || url.includes('signin')) {
        console.log("Logging in as Admin user...");
        await page.type('input[type="email"]', 'admin@example.com');
        await page.type('input[type="password"]', 'Default@123');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
    }
    
    console.log("Navigating to Users page...");
    await page.goto('http://localhost:5173/admin/users'); // Or /students
    await page.waitForTimeout(2000);
    
    console.log("Uploading file...");
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
        await fileInput.uploadFile(path.join(__dirname, 'demo_students.xlsx'));
        console.log("File attached!");
        await page.waitForTimeout(3000); // give time for upload API
        
        console.log("Scanning table for 'Alice Demo'...");
        const html = await page.content();
        if (html.includes('Alice') || html.includes('alice.demo')) {
            console.log("SUCCESS: Bulk Students found in the DOM!");
        } else {
            console.log("FAILED: Students not found.");
        }
    } else {
        console.log("Could not find file input on page.");
    }

    await browser.close();
})();
