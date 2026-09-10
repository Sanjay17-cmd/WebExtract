const { chromium } = require("playwright");

/**
 * Capture a full-page screenshot using Playwright with optional injected session cookies
 * and browser user-agent.
 *
 * @param {string} url - Target URL to capture
 * @param {string} screenshotPath - File path to save PNG
 * @param {Array} cookies - Injected cookies from Electron session
 * @param {object} options - Optional configuration (e.g. userAgent)
 */
async function takeFullPageScreenshot(
    url,
    screenshotPath,
    cookies = [],
    options = {}
) {
    const userAgent = options.userAgent || undefined;

    const browser = await chromium.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled"
        ]
    });

    try {
        const context = await browser.newContext({
            viewport: { width: 1440, height: 900 },
            userAgent: userAgent,
            bypassCSP: true
        });

        if (cookies && cookies.length) {
            await context.addCookies(cookies);
        }

        const page = await context.newPage();

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        // Trigger lazy-loaded images & feed posts
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 400;
                const timer = setInterval(() => {
                    const scrollHeight = document.body ? document.body.scrollHeight : 0;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight || totalHeight >= 12000) {
                        clearInterval(timer);
                        window.scrollTo(0, 0);
                        resolve();
                    }
                }, 80);
            });
        });

        await page.waitForTimeout(800);

        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

module.exports = {
    takeFullPageScreenshot
};