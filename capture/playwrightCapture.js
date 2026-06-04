const { chromium } = require("playwright");

async function takeFullPageScreenshot(
    url,
    screenshotPath,
    cookies = []
) {

    const browser =
        await chromium.launch({

            headless: true
        });

    try {
        const context =
    await browser
    .newContext({

        viewport: {

            width: 1440,

            height: 900
        }
    });

if (

    cookies.length

) {

    await context
    .addCookies(
        cookies
    );
}

const page =
    await context
    .newPage();

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
await page.waitForTimeout(

    5000
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