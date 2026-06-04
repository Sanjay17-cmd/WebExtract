const { chromium } = require("playwright");

async function takeFullPageScreenshot(

    url,

    screenshotPath
) {

    const browser =
        await chromium.launch({

            headless: true
        });

    try {

        const page =
            await browser.newPage({

                viewport: {

                    width: 1440,

                    height: 900
                }
            });

        // ====================================
        // OPEN URL
        // ====================================

        await page.goto(

            url,

            {

                waitUntil:

                    "networkidle",

                timeout: 60000
            }
        );

        // ====================================
        // FULL PAGE SCREENSHOT
        // ====================================

        await page.screenshot({

            path:

                screenshotPath,

            fullPage: true
        });

    } finally {

        await browser.close();
    }
}

module.exports = {

    takeFullPageScreenshot
};