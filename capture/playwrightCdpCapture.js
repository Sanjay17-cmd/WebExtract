const { chromium } = require("playwright");
async function captureViaPlaywrightCDP(targetUrl, screenshotPath, options = {}) {
    if (!targetUrl || !options.htmlSnapshot) {
        throw new Error("A target URL and captured HTML snapshot are required");
    }

    const browser = await chromium.launch({ headless: true });

    try {
        const context = await browser.newContext({
            storageState: {
                cookies: options.cookies || []
            }
        });
        const page = await context.newPage();
        const bootstrapHtml = "<!doctype html><html><head></head><body></body></html>";

        await page.route(targetUrl, (route) => route.fulfill({
            status: 200,
            contentType: "text/html",
            body: bootstrapHtml
        }));
        await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.unroute(targetUrl);

        await page.evaluate(({ html, baseUrl }) => {
            const snapshot = new DOMParser().parseFromString(html, "text/html");
            snapshot.querySelectorAll("script, meta[http-equiv='refresh'], meta[http-equiv='Content-Security-Policy']")
                .forEach((element) => element.remove());

            let base = snapshot.querySelector("base");
            if (!base) {
                base = snapshot.createElement("base");
                snapshot.head.prepend(base);
            }
            base.href = baseUrl;
            snapshot.querySelectorAll("img").forEach((image) => {
                image.loading = "eager";
            });

            document.replaceChild(
                document.importNode(snapshot.documentElement, true),
                document.documentElement
            );
        }, { html: options.htmlSnapshot, baseUrl: targetUrl });

        await page.evaluate(async () => {
            const images = [...document.images].filter((image) => image.src);
            await Promise.race([
                Promise.all(images.map((image) => image.decode().catch(() => {}))),
                new Promise((resolve) => setTimeout(resolve, 2500))
            ]);
        });

        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: "disabled",
            timeout: 30000
        });
        return true;
    } finally {
        await browser.close();
    }
}

module.exports = { captureViaPlaywrightCDP };
