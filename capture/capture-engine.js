const path = require("path");

const fs = require("fs");

const db = require(
    "../storage/sqlite"
);

async function capturePage(page) {

    const url = page.url();

    const title = await page.title();

    const html = await page.content();

    const timestamp = Date.now();

    const screenshotPath =
        `data/screenshots/${timestamp}.png`;

    const htmlPath =
        `data/html/${timestamp}.html`;

    await page.screenshot({

        path: screenshotPath,

        fullPage: true
    });

    fs.writeFileSync(
        htmlPath,
        html
    );

    const metrics = await page.evaluate(() => {

        return {

            dom_nodes:
                document.querySelectorAll("*").length,

            buttons:
                document.querySelectorAll("button").length,

            links:
                document.querySelectorAll("a").length,

            forms:
                document.querySelectorAll("form").length,

            tables:
                document.querySelectorAll("table").length
        };
    });

    db.prepare(`

        INSERT INTO captures (

            url,
            title,
            timestamp,

            screenshot_path,
            html_path,

            metrics_json
        )

        VALUES (?, ?, ?, ?, ?, ?)

    `).run(

        url,

        title,

        new Date().toISOString(),

        screenshotPath,

        htmlPath,

        JSON.stringify(metrics)
    );

    return {

        url,
        title,

        screenshotPath,

        htmlPath,

        metrics
    };
}

module.exports = {
    capturePage
};