const { Pool } = require("pg");

const pool = new Pool({

    user: "webuser",

    host: "localhost",

    database: "webextract",

    password: "webpass",

    port: 5432
});


// ========================================
// INIT TABLE
// ========================================

async function initDatabase() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS captures (

            id SERIAL PRIMARY KEY,

            url TEXT,

            title TEXT,

            captured_at TIMESTAMP,

            screenshot_path TEXT,

            html_path TEXT,

            dom_path TEXT,

            load_time_ms INTEGER,

            dom_nodes INTEGER,

            buttons INTEGER,

            links INTEGER,

            forms INTEGER,

            tables_count INTEGER,

            sections INTEGER
        )

    `);

    console.log(
        "PostgreSQL Ready"
    );
}


// ========================================
// EXPORT
// ========================================

module.exports = {

    pool,

    initDatabase
};