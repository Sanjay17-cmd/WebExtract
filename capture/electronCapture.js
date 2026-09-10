const { webContents } = require("electron");
const fs = require("fs");
const path = require("path");

/**
 * Capture a full-page screenshot of an Electron webContents using CDP
 * (Chrome DevTools Protocol) via the webContents.debugger API.
 *
 * This is TRUE session sharing — same process, same cookies,
 * same localStorage, same everything. The screenshot captures
 * EXACTLY the page the user is looking at.
 *
 * Uses CDP commands:
 *   - Page.getLayoutMetrics → get full page dimensions
 *   - Emulation.setDeviceMetricsOverride → expand viewport
 *   - Page.captureScreenshot → native full-page capture
 *
 * @param {number} webContentsId - The webview's webContents ID
 * @param {string} screenshotPath - Where to save the PNG
 * @param {object} options
 * @param {boolean} options.fullPage - Capture full page (default: true)
 * @param {number} options.maxHeight - Max capture height in px (default: 15000)
 *                                     Prevents infinite-scroll pages from
 *                                     producing impossibly large images
 */
async function captureWebContents(webContentsId, screenshotPath, options = {}) {
    const {
        fullPage = true,
        maxHeight = 15000
    } = options;

    const wc = webContents.fromId(webContentsId);
    if (!wc) {
        throw new Error(`webContents with id ${webContentsId} not found`);
    }

    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

    // ====================================
    // ATTACH CDP DEBUGGER
    // ====================================

    try {
        wc.debugger.attach("1.3");
    } catch (err) {
        // Already attached — that's fine
        if (!err.message.includes("Already attached")) {
            throw err;
        }
    }

    try {
        if (!fullPage) {
            // ====================================
            // VIEWPORT-ONLY SCREENSHOT
            // ====================================

            const { data } = await wc.debugger.sendCommand(
                "Page.captureScreenshot",
                { format: "png" }
            );

            fs.writeFileSync(
                screenshotPath,
                Buffer.from(data, "base64")
            );
            return;
        }

        // ====================================
        // FULL-PAGE SCREENSHOT via CDP
        // ====================================

        // 1. Get the full page dimensions
        const layoutMetrics = await wc.debugger.sendCommand(
            "Page.getLayoutMetrics"
        );

        const size = layoutMetrics.cssContentSize || layoutMetrics.contentSize || layoutMetrics.cssLayoutViewport || layoutMetrics.layoutViewport || {};

        const contentWidth = Math.ceil(
            size.width || 1440
        );

        const contentHeight = Math.min(
            Math.ceil(size.height || 900),
            maxHeight // Cap for infinite-scroll pages
        );

        // 2. Expand viewport to full page size (if possible)
        try {
            await wc.debugger.sendCommand(
                "Emulation.setDeviceMetricsOverride",
                {
                    mobile: false,
                    width: contentWidth,
                    height: contentHeight,
                    deviceScaleFactor: 1
                }
            );
        } catch (_) {}

        // Small wait for the resize to take effect
        await new Promise((resolve) => setTimeout(resolve, 300));

        // 3. Capture the full-page screenshot
        const { data } = await wc.debugger.sendCommand(
            "Page.captureScreenshot",
            {
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
            }
        );

        // 4. Save the screenshot
        fs.writeFileSync(
            screenshotPath,
            Buffer.from(data, "base64")
        );

    } finally {
        // ====================================
        // CLEANUP: Restore viewport & detach
        // ====================================

        try {
            await wc.debugger.sendCommand(
                "Emulation.clearDeviceMetricsOverride"
            );
        } catch (_) {
            // Ignore cleanup errors
        }

        try {
            wc.debugger.detach();
        } catch (_) {
            // Ignore detach errors
        }
    }
}

module.exports = {
    captureWebContents
};
