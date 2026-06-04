const fs = require("fs");

const { pool } =
require("../storage/postgres");

async function saveCrawlerCapture(

    crawlRunId,

    url,

    pageData,

    depth,

    screenshotPath,

    htmlPath,

    domPath,

    structuredPath

) {

    await pool.query(

        `

        INSERT INTO crawl_pages (

            crawl_run_id,

            url,

            title,

            depth,

            screenshot_path,

            html_path,

            dom_path,

            structured_data_path

        )

        VALUES (

            $1,$2,$3,$4,

            $5,$6,$7,$8

        )

        `,

        [

            crawlRunId,

            url,

            pageData.title,

            depth,

            screenshotPath,

            htmlPath,

            domPath,

            structuredPath
        ]
    );
}

module.exports = {

    saveCrawlerCapture
};