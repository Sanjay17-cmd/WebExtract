const { chromium } = require("playwright");

/**
 * Capture a full-page screenshot in Playwright using browser state exported
 * from Electron's active webview.
 *
 * Cookies, localStorage, and sessionStorage are restored before navigation.
 * Lazy-loaded content is scrolled into view before the full-page capture.
 *
 * @param {string} targetUrl - Target URL of the webview
 * @param {string} screenshotPath - Where to save the PNG screenshot
 * @param {object} options - Capture configuration and exported browser state
 */
async function captureViaPlaywrightCDP(targetUrl, screenshotPath, options = {}) {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
    } catch (err) {
        throw new Error(`Failed to launch Playwright Chromium: ${err.message}`);
    }

    try {
        const browserState = options.browserState || {};
        const localStorage = browserState.localStorage || {};
        const origins = targetUrl
            ? [{
                origin: new URL(targetUrl).origin,
                localStorage: Object.entries(localStorage).map(([name, value]) => ({
                    name,
                    value: String(value ?? "")
                }))
            }]
            : [];
        const context = await browser.newContext({
            storageState: {
                cookies: browserState.cookies || [],
                origins
            }
        });

        await context.addInitScript(({ origin, values }) => {
            if (window.location.origin !== origin) return;
            for (const [key, value] of Object.entries(values)) {
                window.sessionStorage.setItem(key, String(value ?? ""));
            }
        }, {
            origin: targetUrl ? new URL(targetUrl).origin : "",
            values: browserState.sessionStorage || {}
        });

        const targetPage = await context.newPage();
        await targetPage.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        await targetPage.waitForTimeout(500);

        // Keep scrolling while page height grows; stop after it settles or a safety limit.
        await targetPage.evaluate(async () => {
            let stableRounds = 0;
            let previousHeight = 0;

            for (let round = 0; round < 150 && stableRounds < 6; round += 1) {
                const currentHeight = Math.max(
                    document.documentElement.scrollHeight,
                    document.body ? document.body.scrollHeight : 0
                );
                window.scrollTo(0, currentHeight);
                await new Promise((resolve) => setTimeout(resolve, 400));

                const nextHeight = Math.max(
                    document.documentElement.scrollHeight,
                    document.body ? document.body.scrollHeight : 0
                );
                stableRounds = nextHeight > previousHeight ? 0 : stableRounds + 1;
                previousHeight = nextHeight;
            }

            window.scrollTo(0, 0);
        });
        await targetPage.waitForTimeout(300);

        await targetPage.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: "disabled"
        });

        return true;
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (_) {
                // Ignore disconnect errors
            }
        }
    }
}

module.exports = {
    captureViaPlaywrightCDP
};
