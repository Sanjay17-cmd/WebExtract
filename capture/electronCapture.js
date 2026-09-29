const { webContents } = require("electron");
const fs = require("fs");
const path = require("path");

/** Capture a screenshot from the current Electron webContents session. */
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

        const layoutMetrics = await wc.debugger.sendCommand(
            "Page.getLayoutMetrics"
        );

        const size = layoutMetrics.cssContentSize || layoutMetrics.contentSize || layoutMetrics.cssLayoutViewport || layoutMetrics.layoutViewport || {};

        const contentWidth = Math.ceil(
            size.width || 1440
        );

        const contentHeight = Math.min(
            Math.ceil(size.height || 900),
            maxHeight // Prevent an oversized fallback image.
        );

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

        fs.writeFileSync(
            screenshotPath,
            Buffer.from(data, "base64")
        );

    } finally {
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
