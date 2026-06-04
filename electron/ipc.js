const fs = require("fs");
const path = require("path");
const { ipcMain } = require("electron");
const { pool } = require("../storage/postgres");
const { takeFullPageScreenshot } = require("../capture/playwrightCapture");

// ========================================
// SAVE CAPTURE
// ========================================
const { summarizeComparison } = require("./gemini");

ipcMain.handle("summarize-comparison", async (event, payload) => {
    try {
        const a = Math.min(payload.captureAId, payload.captureBId);
        const b = Math.max(payload.captureAId, payload.captureBId);

        const cached = await pool.query(
            `
            SELECT summary_json
            FROM comparison_summaries
            WHERE capture_a_id = $1 AND capture_b_id = $2
            `,
            [a, b]
        );

        if (cached.rows.length > 0) {
            return {
                success: true,
                cached: true,
                summary: JSON.parse(cached.rows[0].summary_json)
            };
        }

        const summary = await summarizeComparison(payload.diffPayload);

        await pool.query(
            `
            INSERT INTO comparison_summaries (
                capture_a_id,
                capture_b_id,
                summary_json
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (capture_a_id, capture_b_id)
            DO UPDATE SET summary_json = EXCLUDED.summary_json,
                          created_at = NOW()
            `,
            [a, b, JSON.stringify(summary)]
        );

        return {
            success: true,
            cached: false,
            summary
        };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            error: err.message
        };
    }
});

ipcMain.handle("save-capture", async (event, captureData) => {
    try {
        const timestamp = Date.now();

        const dataRoot = path.resolve(process.cwd(), "data");
        const screenshotDir = path.join(dataRoot, "screenshots");
        const htmlDir = path.join(dataRoot, "html");
        const domDir = path.join(dataRoot, "dom");
        const structuredDir = path.join(dataRoot, "structured");

        fs.mkdirSync(screenshotDir, { recursive: true });
        fs.mkdirSync(htmlDir, { recursive: true });
        fs.mkdirSync(domDir, { recursive: true });
        fs.mkdirSync(structuredDir, { recursive: true });

        const screenshotPath = path.join(screenshotDir, `${timestamp}.png`);
        const htmlPath = path.join(htmlDir, `${timestamp}.html`);
        const domPath = path.join(domDir, `${timestamp}.json`);
        const structuredPath = path.join(structuredDir, `${timestamp}.json`);

        fs.writeFileSync(htmlPath, captureData.html, "utf-8");

        fs.writeFileSync(
            domPath,
            JSON.stringify(captureData.domNodes, null, 2),
            "utf-8"
        );

        fs.writeFileSync(
            structuredPath,
            JSON.stringify(
                {
                    buttons: captureData.buttons || [],
                    links: captureData.links || [],
                    forms: captureData.forms || [],
                    tables: captureData.tables || [],
                    headings: captureData.headings || [],
                    sections: captureData.sections || [],
                    apiCalls: captureData.apiCalls || []
                },
                null,
                2
            ),
            "utf-8"
        );

        const contentSize =
    await event.sender.executeJavaScript(`

        ({
            width:

                document.documentElement
                .scrollWidth,

            height:

                document.documentElement
                .scrollHeight
        })

    `);

await takeFullPageScreenshot(

    captureData.url,

    screenshotPath
);

        const query = `
            INSERT INTO captures (
                url,
                title,
                captured_at,
                screenshot_path,
                html_path,
                dom_path,
                structured_data_path,
                load_time_ms,
                dom_nodes,
                buttons_count,
                links_count,
                forms_count,
                tables_count,
                sections_count,
                headings_count,
                api_count
            )
            VALUES (
                $1, $2, NOW(),
                $3, $4, $5, $6,
                $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15
            )
            RETURNING id
        `;

        const values = [
            captureData.url || "",
            captureData.title || "",
            screenshotPath,
            htmlPath,
            domPath,
            structuredPath,
            Number(captureData.metrics?.loadTimeMs || 0),
            Number(captureData.metrics?.domNodes || 0),
            Number(captureData.buttons?.length || 0),
            Number(captureData.links?.length || 0),
            Number(captureData.forms?.length || 0),
            Number(captureData.tables?.length || 0),
            Number(captureData.sections?.length || 0),
            Number(captureData.headings?.length || 0),
            Number(captureData.apiCalls?.length || 0)
        ];

        const result = await pool.query(query, values);

        return {
            success: true,
            captureId: result.rows[0].id
        };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            error: err.message
        };
    }
});

// ========================================
// GET HISTORY LIST
// ========================================

ipcMain.handle("get-history", async () => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                title,
                url,
                captured_at
            FROM captures
            ORDER BY id DESC
            LIMIT 100
        `);

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

// ========================================
// GET SINGLE CAPTURE
// ========================================

ipcMain.handle("get-capture-details", async (event, captureId) => {
    try {
        const result = await pool.query(
            `
                SELECT *
                FROM captures
                WHERE id = $1
            `,
            [captureId]
        );

        if (result.rows.length === 0) {
            return {
                success: false
            };
        }

        const row = result.rows[0];

        const html = fs.readFileSync(row.html_path, "utf-8");

        const domNodes = JSON.parse(
            fs.readFileSync(row.dom_path, "utf-8")
        );

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