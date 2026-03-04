import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', error => console.log('ERROR:', error.message));
    await page.goto('http://localhost:5173/dashboard');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
