const { Pool } = require("pg");

const pool = new Pool({

    user: "webuser",

    host: "localhost",

    database: "webextract",

    password: "webpass",

    port: 5432
});

// ========================================
// INIT DATABASE
// ========================================

async function initDatabase() {

    // ====================================
    // MANUAL CAPTURES
    // ====================================

    await pool.query(`

        CREATE TABLE IF NOT EXISTS captures (

            id SERIAL PRIMARY KEY,

            url TEXT,

            title TEXT,

            captured_at TIMESTAMPTZ DEFAULT NOW(),

            screenshot_path TEXT,

            html_path TEXT,

            dom_path TEXT,

            structured_data_path TEXT,

            load_time_ms INTEGER DEFAULT 0,

            dom_nodes INTEGER DEFAULT 0,

            buttons_count INTEGER DEFAULT 0,

            links_count INTEGER DEFAULT 0,

            forms_count INTEGER DEFAULT 0,

            tables_count INTEGER DEFAULT 0,

            sections_count INTEGER DEFAULT 0,

            headings_count INTEGER DEFAULT 0,

            api_count INTEGER DEFAULT 0

        )

    `);

    // ====================================
    // CRAWL RUNS
    // ====================================

    await pool.query(`

        CREATE TABLE IF NOT EXISTS crawl_runs (

            id SERIAL PRIMARY KEY,

            root_url TEXT,

            started_at TIMESTAMPTZ DEFAULT NOW(),

            finished_at TIMESTAMPTZ,

            total_pages INTEGER DEFAULT 0

        )

    `);

    // ====================================
    // CRAWLED PAGES
    // ====================================

    await pool.query(`

        CREATE TABLE IF NOT EXISTS crawl_pages (

            id SERIAL PRIMARY KEY,

            crawl_run_id INTEGER

                REFERENCES crawl_runs(id)

                ON DELETE CASCADE,

            url TEXT,

            title TEXT,

            depth INTEGER,

            captured_at TIMESTAMPTZ DEFAULT NOW(),

            screenshot_path TEXT,

            html_path TEXT,

            dom_path TEXT,

            structured_data_path TEXT

        )

    `);

    // ====================================
    // ALTERS
    // ====================================

    const alterStatements = [

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS structured_data_path TEXT`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS load_time_ms INTEGER DEFAULT 0`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS dom_nodes INTEGER DEFAULT 0`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS buttons_count INTEGER DEFAULT 0`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS links_count INTEGER DEFAULT 0`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS forms_count INTEGER DEFAULT 0`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS tables_count INTEGER DEFAULT 0`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS sections_count INTEGER DEFAULT 0`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS headings_count INTEGER DEFAULT 0`,

        `ALTER TABLE captures ADD COLUMN IF NOT EXISTS api_count INTEGER DEFAULT 0`
    ];

    for (

        const sql

        of alterStatements

    ) {

        await pool.query(sql);
    }

    console.log(

        "PostgreSQL Ready"
    );
}

module.exports = {

    pool,

    initDatabase
};