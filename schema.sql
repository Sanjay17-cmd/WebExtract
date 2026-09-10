-- PostgreSQL Schema for WebExtract Application

-- 1. Captures Table (stores individual page captures and metadata)
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
);

-- 2. Crawl Runs Table (stores website crawling sessions)
CREATE TABLE IF NOT EXISTS crawl_runs (
    id SERIAL PRIMARY KEY,
    root_url TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    total_pages INTEGER DEFAULT 0
);

-- 3. Crawled Pages Table (stores individual pages collected during a crawl run)
CREATE TABLE IF NOT EXISTS crawl_pages (
    id SERIAL PRIMARY KEY,
    crawl_run_id INTEGER REFERENCES crawl_runs(id) ON DELETE CASCADE,
    url TEXT,
    title TEXT,
    depth INTEGER,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    screenshot_path TEXT,
    html_path TEXT,
    dom_path TEXT,
    structured_data_path TEXT
);
