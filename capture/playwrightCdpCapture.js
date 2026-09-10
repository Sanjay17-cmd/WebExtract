const { chromium } = require("playwright");

/**
 * Capture a full-page screenshot using Playwright connected directly to
 * Electron's running instance over Chrome DevTools Protocol (CDP).
 *
 * This shares 100% of the Electron session:
 *   - Active logins, cookies, localStorage, and sessionStorage
 *   - Live rendered DOM of the user's webview
 *   - True full-page scrolling without application UI
 *
 * @param {string} targetUrl - Target URL of the webview
 * @param {string} screenshotPath - Where to save the PNG screenshot
 * @param {object} options - Configuration options (port, timeout, etc.)
 */
async function captureViaPlaywrightCDP(targetUrl, screenshotPath, options = {}) {
    const port = options.port || 9222;
    const cdpUrl = `http://127.0.0.1:${port}`;

    let browser;
    try {
        browser = await chromium.connectOverCDP(cdpUrl, { timeout: 8000 });
    } catch (err) {
        throw new Error(`Failed to connect to Electron CDP at ${cdpUrl}: ${err.message}`);
    }

    try {
        const contexts = browser.contexts();
        let targetPage = null;

        // 1. First priority: Look for the page matching the webview's URL
        let normalizedTarget = "";
        try {
            if (targetUrl) {
                const u = new URL(targetUrl);
                normalizedTarget = (u.origin + u.pathname).toLowerCase().replace(/\/$/, "");
            }
        } catch (_) {}

        for (const ctx of contexts) {
            for (const p of ctx.pages()) {
                const pUrl = p.url() || "";
                if (
                    pUrl.includes("localhost:5173") ||
                    pUrl.includes("localhost:5174") ||
                    pUrl.startsWith("devtools://") ||
                    pUrl === "about:blank"
                ) {
                    continue;
                }

                if (normalizedTarget) {
                    try {
                        const pu = new URL(pUrl);
                        const normP = (pu.origin + pu.pathname).toLowerCase().replace(/\/$/, "");
                        if (normP === normalizedTarget || normP.includes(normalizedTarget) || normalizedTarget.includes(normP)) {
                            targetPage = p;
                            break;
                        }
                    } catch (_) {}
                }
            }
            if (targetPage) break;
        }

        // 2. Fallback: Take the first non-main-window, non-devtools page
        if (!targetPage) {
            for (const ctx of contexts) {
                for (const p of ctx.pages()) {
                    const pUrl = p.url() || "";
                    if (
                        !pUrl.includes("localhost:5173") &&
                        !pUrl.includes("localhost:5174") &&
                        !pUrl.startsWith("devtools://") &&
                        pUrl !== "about:blank"
                    ) {
                        targetPage = p;
                        break;
                    }
                }
                if (targetPage) break;
            }
        }

        if (!targetPage) {
            throw new Error(`No active webview target page found in Electron CDP session (contexts: ${contexts.length})`);
        }

        // 3. Trigger scroll down to ensure dynamic/lazy-loaded feeds (e.g. LinkedIn, Twitter) are rendered
        try {
            await targetPage.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 500;
                    const timer = setInterval(() => {
                        const scrollHeight = document.documentElement ? document.documentElement.scrollHeight : (document.body ? document.body.scrollHeight : 0);
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight || totalHeight >= 10000) {
                            clearInterval(timer);
                            window.scrollTo(0, 0);
                            resolve();
                        }
                    }, 50);
                });
            });
            await targetPage.waitForTimeout(400);
        } catch (_) {
            // Ignore scroll evaluation errors on cross-origin frames
        }

        // 4. Capture full-page screenshot using Playwright's native fullPage engine
        await targetPage.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: "disabled"
        });

        return true;
    } finally {
        if (browser) {
            try {
                if (typeof browser.disconnect === "function") {
                    await browser.disconnect();
                } else {
                    await browser.close();
                }
            } catch (_) {
                // Ignore disconnect errors
            }
        }
    }
}

module.exports = {
    captureViaPlaywrightCDP
};
