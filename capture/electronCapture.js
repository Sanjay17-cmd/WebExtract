const { webContents } = require("electron");
const fs = require("fs");
const path = require("path");

/**
 * Capture a full-page screenshot of an Electron webContents using CDP
 * (Chrome DevTools Protocol) via the webContents.debugger API.
 *
 * Benefits:
 *   - TRUE session fidelity: same process, same logged-in cookies, same localStorage.
 *   - Clean content capture: captures ONLY the web page (no Electron UI framing/buttons).
 *   - Full-page scrolled capture: resizes CDP metrics and auto-scrolls for dynamic feeds.
 *
 * @param {number} webContentsId - The webview's webContents ID
 * @param {string} screenshotPath - File path to save the PNG
 * @param {object} options
 * @param {boolean} options.fullPage - Whether to capture full scrolled height (default: true)
 * @param {number} options.maxHeight - Cap height for infinite-scroll pages (default: 25000)
 */
async function captureWebContents(webContentsId, screenshotPath, options = {}) {
    const {
        fullPage = true,
        maxHeight = 25000
    } = options;

    const wc = webContents.fromId(webContentsId);
    if (!wc) {
        throw new Error(`webContents with id ${webContentsId} not found`);
    }

    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

    // =========================================================
    // STEP 1: Programmatic Auto-Scroll (Loads dynamic/lazy feed content)
    // =========================================================
    if (fullPage) {
        try {
            await wc.executeJavaScript(`
                (async () => {
                    await new Promise((resolve) => {
                        let totalHeight = 0;
                        const distance = 400;
                        const timer = setInterval(() => {
                            const scrollHeight = Math.max(
                                document.documentElement.scrollHeight,
                                document.body ? document.body.scrollHeight : 0
                            );
                            window.scrollBy(0, distance);
                            totalHeight += distance;
                            if (totalHeight >= scrollHeight || totalHeight >= 12000) {
                                clearInterval(timer);
                                window.scrollTo(0, 0);
                                resolve();
                            }
                        }, 60);
                    });
                })();
            `);
            // Brief pause for scroll position & lazy load stabilization
            await new Promise((resolve) => setTimeout(resolve, 400));
        } catch (err) {
            console.warn("Auto-scroll pre-capture warning:", err.message);
        }
    }

    // =========================================================
    // STEP 2: Attach CDP Debugger
    // =========================================================
    try {
        wc.debugger.attach("1.3");
    } catch (err) {
        if (!err.message.includes("Already attached")) {
            throw err;
        }
    }

    try {
        if (!fullPage) {
            // Viewport-only capture
            const { data } = await wc.debugger.sendCommand(
                "Page.captureScreenshot",
                { format: "png", fromSurface: true }
            );
            fs.writeFileSync(screenshotPath, Buffer.from(data, "base64"));
            return;
        }

        // =========================================================
        // STEP 3: Compute Full Document Layout Dimensions
        // =========================================================
        const domDimensions = await wc.executeJavaScript(`
            ({
                width: Math.max(
                    document.documentElement.scrollWidth,
                    document.body ? document.body.scrollWidth : 0,
                    window.innerWidth || 1440
                ),
                height: Math.max(
                    document.documentElement.scrollHeight,
                    document.body ? document.body.scrollHeight : 0,
                    window.innerHeight || 900
                )
            })
        `).catch(() => ({ width: 1440, height: 900 }));

        let contentWidth = domDimensions.width || 1440;
        let contentHeight = domDimensions.height || 900;

        try {
            const layoutMetrics = await wc.debugger.sendCommand("Page.getLayoutMetrics");
            const cWidth = layoutMetrics.cssContentSize?.width || layoutMetrics.contentSize?.width;
            const cHeight = layoutMetrics.cssContentSize?.height || layoutMetrics.contentSize?.height;
            if (cWidth && cWidth > contentWidth) contentWidth = Math.ceil(cWidth);
            if (cHeight && cHeight > contentHeight) contentHeight = Math.ceil(cHeight);
        } catch (_) {}

        contentHeight = Math.min(contentHeight, maxHeight);

        // =========================================================
        // STEP 4: Override CDP Device Metrics to Full Height
        // =========================================================
        await wc.debugger.sendCommand("Emulation.setDeviceMetricsOverride", {
            mobile: false,
            width: Math.max(contentWidth, 1280),
            height: Math.max(contentHeight, 800),
            deviceScaleFactor: 1
        });

        await new Promise((resolve) => setTimeout(resolve, 350));

        // =========================================================
        // STEP 5: Capture Full Scrolled Page Screenshot
        // =========================================================
        const { data } = await wc.debugger.sendCommand("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: true,
            fromSurface: true,
            clip: {
                x: 0,
                y: 0,
                width: contentWidth,
                height: contentHeight,
                scale: 1
            }
        });

        fs.writeFileSync(screenshotPath, Buffer.from(data, "base64"));

    } finally {
        // =========================================================
        // STEP 6: Restore Metrics & Detach Debugger
        // =========================================================
        try {
            await wc.debugger.sendCommand("Emulation.clearDeviceMetricsOverride");
        } catch (_) {}
        try {
            wc.debugger.detach();
        } catch (_) {}
    }
}

module.exports = {
    captureWebContents
};
