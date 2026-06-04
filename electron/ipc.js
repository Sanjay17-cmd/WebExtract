const fs = require("fs");

const path = require("path");

const { ipcMain } = require("electron");

const { pool } = require(
    "../storage/postgres"
);


// ========================================
// SAVE CAPTURE
// ========================================

ipcMain.handle(

    "save-capture",

    async (

        event,

        captureData
    ) => {

        try {

            // ====================================
            // TIMESTAMP
            // ====================================

            const timestamp =
                Date.now();

            // ====================================
            // FILE PATHS
            // ====================================

            const screenshotPath =
                path.join(

                    "data",
                    "screenshots",

                    `${timestamp}.png`
                );

            const htmlPath =
                path.join(

                    "data",
                    "html",

                    `${timestamp}.html`
                );

            const domPath =
                path.join(

                    "data",
                    "dom",

                    `${timestamp}.json`
                );

            // ====================================
            // SAVE HTML
            // ====================================

            fs.writeFileSync(

                htmlPath,

                captureData.html
            );

            // ====================================
            // SAVE DOM JSON
            // ====================================

            fs.writeFileSync(

                domPath,

                JSON.stringify(

                    captureData.domNodes,

                    null,

                    2
                )
            );

            // ====================================
            // SAVE SCREENSHOT
            // ====================================

            const image =
                await event.sender.capturePage();

            fs.writeFileSync(

                screenshotPath,

                image.toPNG()
            );

            // ====================================
            // INSERT DATABASE
            // ====================================

            const query = `

                INSERT INTO captures (

                    url,
                    title,
                    captured_at,

                    screenshot_path,
                    html_path,
                    dom_path,

                    load_time_ms,
                    dom_nodes,

                    buttons,
                    links,
                    forms,
                    tables_count,
                    sections

                )

                VALUES (

                    $1, $2, NOW(),

                    $3, $4, $5,

                    $6, $7,

                    $8, $9, $10,
                    $11, $12
                )

                RETURNING id

            `;

            const values = [

                captureData.url,

                captureData.title,

                screenshotPath,

                htmlPath,

                domPath,

                0,

                captureData.metrics.domNodes,

                captureData.metrics.buttons,

                captureData.metrics.links,

                captureData.metrics.forms,

                captureData.metrics.tables,

                captureData.metrics.sections
            ];

            const result =
                await pool.query(

                    query,

                    values
                );

            return {

                success: true,

                captureId:
                    result.rows[0].id
            };

        } catch (err) {

            console.error(err);

            return {

                success: false,

                error: err.message
            };
        }
    }
);

// ========================================
// GET HISTORY LIST
// ========================================

ipcMain.handle(

    "get-history",

    async () => {

        try {

            const result =
                await pool.query(`

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
    }
);


// ========================================
// GET SINGLE CAPTURE
// ========================================

ipcMain.handle(

    "get-capture-details",

    async (

        event,

        captureId
    ) => {

        try {

            const result =
                await pool.query(`

                    SELECT *

                    FROM captures

                    WHERE id = $1

                `,

                [captureId]
            );

            if (

                result.rows.length === 0
            ) {

                return {

                    success: false
                };
            }

            const row =
                result.rows[0];

            // ====================================
            // LOAD FILES
            // ====================================

            const html =
                fs.readFileSync(

                    row.html_path,

                    "utf-8"
                );

            const domNodes =
                JSON.parse(

                    fs.readFileSync(

                        row.dom_path,

                        "utf-8"
                    )
                );

            return {

                success: true,

                data: {

                    ...row,

                    html,

                    domNodes
                }
            };

        } catch (err) {

            console.error(err);

            return {

                success: false,

                error: err.message
            };
        }
    }
);