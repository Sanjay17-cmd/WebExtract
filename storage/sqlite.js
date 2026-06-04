const Database = require(
    "better-sqlite3"
);

const db = new Database(
    "data/app.db"
);

db.exec(`

CREATE TABLE IF NOT EXISTS captures (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    url TEXT,

    title TEXT,

    timestamp TEXT,

    screenshot_path TEXT,

    html_path TEXT,

    metrics_json TEXT
)

`);

module.exports = db;