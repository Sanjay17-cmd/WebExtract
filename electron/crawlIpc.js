const fs = require("fs");
const path = require("path");
const { ipcMain } = require("electron");

const { pool } = require("../storage/postgres");
const { crawlWebsite } = require("../capture/siteCrawler");
const { extractPageData } = require("../capture/extractPageData");
const { saveCrawlerCapture } = require("../capture/saveCrawlerCapture");

ipcMain.handle("start-crawl", async (event, config) => {
    try {
        const runResult = await pool.query(
            `
            INSERT INTO crawl_runs (
                root_url
            )
            VALUES ($1)
            RETURNING id
            `,
            [config.url]
        );

        const crawlRunId = runResult.rows[0].id;

        const result = await crawlWebsite(
            config.url,
            config,
            async (page, url, depth) => {
                console.log("Visited:", url, "Depth:", depth);

                const pageData = await extractPageData(page);

                const timestamp = Date.now();
                const dataRoot = path.resolve(process.cwd(), "data");
                const screenshotDir = path.join(dataRoot, "crawl_screenshots");
                const htmlDir = path.join(dataRoot, "crawl_html");
                const domDir = path.join(dataRoot, "crawl_dom");
                const structuredDir = path.join(dataRoot, "crawl_structured");

                fs.mkdirSync(screenshotDir, { recursive: true });
                fs.mkdirSync(htmlDir, { recursive: true });
                fs.mkdirSync(domDir, { recursive: true });
                fs.mkdirSync(structuredDir, { recursive: true });

                const screenshotPath = path.join(screenshotDir, `${timestamp}.png`);
                const htmlPath = path.join(htmlDir, `${timestamp}.html`);
                const domPath = path.join(domDir, `${timestamp}.json`);
                const structuredPath = path.join(structuredDir, `${timestamp}.json`);

                await page.screenshot({
                    path: screenshotPath,
                    fullPage: true
                });

                fs.writeFileSync(htmlPath, pageData.html, "utf-8");

                fs.writeFileSync(
                    domPath,
                    JSON.stringify(
                        {
                            domNodes: pageData.domNodes
                        },
                        null,
                        2
                    ),
                    "utf-8"
                );

                fs.writeFileSync(
                    structuredPath,
                    JSON.stringify(
                        {
                            buttons: pageData.buttons,
                            links: pageData.links,
                            forms: pageData.forms,
                            tables: pageData.tables,
                            headings: pageData.headings
                        },
                        null,
                        2
                    ),
                    "utf-8"
                );

                await saveCrawlerCapture(
                    crawlRunId,
                    url,
                    pageData,
                    depth,
                    screenshotPath,
                    htmlPath,
                    domPath,
                    structuredPath
                );
            }
        );

        await pool.query(
            `
            UPDATE crawl_runs
            SET
                finished_at = NOW(),
                total_pages = $1
            WHERE id = $2
            `,
            [result.pagesVisited, crawlRunId]
        );

        return {
            success: true,
            crawlRunId,
            pagesVisited: result.pagesVisited
        };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            error: err.message
        };
    }
});

ipcMain.handle("get-crawl-runs", async () => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                root_url,
                started_at,
                finished_at,
                total_pages
            FROM crawl_runs
            ORDER BY id DESC
            LIMIT 100
            `
        );

        return {
            success: true,
            rows: result.rows
        };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            error: err.message
        };
    }
});

ipcMain.handle("get-crawl-pages", async (event, crawlRunId) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                crawl_run_id,
                url,
                title,
                depth,
                captured_at,
                screenshot_path,
                html_path,
                dom_path,
                structured_data_path
            FROM crawl_pages
            WHERE crawl_run_id = $1
            ORDER BY depth ASC, id ASC
            `,
            [crawlRunId]
        );

        return {
            success: true,
            rows: result.rows
        };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            error: err.message
        };
    }
});

ipcMain.handle("get-crawl-page-details", async (event, pageId) => {
    try {
        const result = await pool.query(
            `
            SELECT *
            FROM crawl_pages
            WHERE id = $1
            `,
            [pageId]
        );

        if (result.rows.length === 0) {
            return { success: false };
        }

        const row = result.rows[0];

        const html = fs.readFileSync(row.html_path, "utf-8");
        const domNodes = JSON.parse(fs.readFileSync(row.dom_path, "utf-8"));
        const structured = JSON.parse(
            fs.readFileSync(row.structured_data_path, "utf-8")
        );

        return {
            success: true,
            data: {
                ...row,
                html,
                domNodes,
                structured
            }
        };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            error: err.message
        };
    }
});