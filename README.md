# WebExtract

WebExtract is a desktop-based website inspection, monitoring, crawling, and change-tracking platform built using Electron, React, Playwright, and PostgreSQL.

The application allows users to browse websites inside an embedded Chromium browser, capture webpage snapshots, store structured webpage information, crawl websites automatically, compare webpage versions, detect visual changes, and track structural modifications over time.

---

## Features

### Website Browser

* Embedded Chromium browser using Electron
* Open and navigate websites
* Real-time webpage rendering

### Webpage Capture

* Full-page webpage capture
* HTML source storage
* DOM structure extraction
* Structured webpage metadata storage
* Timestamp-based versioning

### DOM Analysis

* Button extraction
* Link extraction
* Form extraction
* Table extraction
* Section extraction
* Heading extraction
* DOM node counting

### Performance Analysis

* Page load metrics
* DOM statistics
* API call tracking
* UI element statistics

### History Management

* Capture history
* Version history
* Timestamp-based records
* Screenshot history

### Version Comparison

* Compare two webpage versions
* Compare HTML structure
* Compare DOM changes
* Compare extracted UI elements
* Compare performance metrics

### HTML Diff Viewer

* Color-coded HTML comparison
* Added content highlighting
* Removed content highlighting
* Source-level change inspection

### Visual Screenshot Comparison

* Pixel-level image comparison
* Screenshot difference generation
* Changed region highlighting
* Visual change detection

### Website Crawling

* Automatic website crawling
* Same-domain crawling
* Configurable crawl depth
* Configurable page limits
* Crawl delay configuration
* External-link control

### Session Sharing

* Share Electron session cookies with Playwright
* Capture authenticated webpages
* Preserve logged-in sessions

### PostgreSQL Storage

* Capture storage
* Crawl storage
* Structured metadata storage
* Historical version tracking

---

## Technology Stack

### Frontend

* React
* Vite

### Desktop Application

* Electron

### Browser Automation

* Playwright

### Database

* PostgreSQL

### Image Processing

* PNGJS
* Pixelmatch

### Code Editor

* Monaco Editor

---

## System Requirements

### Ubuntu

Update packages:

```bash
sudo apt update
sudo apt upgrade -y
```

Install Node.js and npm:

```bash
sudo apt install nodejs npm -y
```

Verify installation:

```bash
node -v
npm -v
```

Install PostgreSQL:

```bash
sudo apt install postgresql postgresql-contrib -y
```

Start PostgreSQL:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Verify PostgreSQL:

```bash
sudo systemctl status postgresql
```

---

## Database Setup

Open PostgreSQL:

```bash
sudo -u postgres psql
```

Create user:

```sql
CREATE USER webuser WITH PASSWORD 'webpass';
```

Create database:

```sql
CREATE DATABASE webextract;
```

Grant permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE webextract TO webuser;
```

Exit PostgreSQL:

```sql
\q
```

---

## Project Installation

Clone repository:

```bash
git clone <repository-url>
```

Move into project:

```bash
cd webextract
```

If downloaded as ZIP:

```bash
unzip webextract.zip
cd webextract
```

Install root dependencies:

```bash
npm install
```

Install renderer dependencies:

```bash
cd renderer
npm install
cd ..
```

Install Playwright browsers:

```bash
npx playwright install
```

Install Playwright Linux dependencies:

```bash
sudo npx playwright install-deps
```

---

## Environment Variables

Create environment file:

```bash
touch .env
```

Example:

```env
GEMINI_API_KEY=YOUR_API_KEY
```

---

## Running the Application

Start the application:

```bash
npm run dev
```

This command starts:

* React Frontend
* Electron Desktop Application
* Embedded Chromium Browser

---

## Main Workflow

### Capture Workflow

1. Open website
2. Browse webpage
3. Click Capture
4. Extract webpage data
5. Generate full-page screenshot
6. Store data in PostgreSQL
7. Save capture history

### Comparison Workflow

1. Open Compare page
2. Select two webpage versions
3. Compare metrics
4. Compare HTML source
5. Compare DOM structure
6. Compare screenshots
7. Review visual differences

### Crawling Workflow

1. Enter root URL
2. Configure crawl depth
3. Configure page limits
4. Start crawler
5. Automatically visit pages
6. Capture webpage data
7. Store crawl results
8. Review crawl history

---

## Stored Data

For every capture the system stores:

* URL
* Page title
* Capture timestamp
* Screenshot
* HTML source
* DOM structure
* Buttons
* Links
* Forms
* Tables
* Sections
* Headings
* API calls
* Performance metrics

---

## PostgreSQL Database Setup

The application automatically creates tables during startup. The SQL below is provided for manual database setup or deployment environments where automatic table creation is disabled.

-- =========================================
-- DATABASE
-- =========================================

CREATE USER webuser
WITH PASSWORD 'webpass';

CREATE DATABASE webextract;

GRANT ALL PRIVILEGES
ON DATABASE webextract
TO webuser;

\c webextract

GRANT ALL ON SCHEMA public
TO webuser;

ALTER SCHEMA public
OWNER TO webuser;

-- =========================================
-- CAPTURES TABLE
-- =========================================

CREATE TABLE captures (

    id SERIAL PRIMARY KEY,

    url TEXT,

    title TEXT,

    captured_at TIMESTAMPTZ
    DEFAULT NOW(),

    screenshot_path TEXT,

    html_path TEXT,

    dom_path TEXT,

    structured_data_path TEXT,

    load_time_ms INTEGER
    DEFAULT 0,

    dom_nodes INTEGER
    DEFAULT 0,

    buttons_count INTEGER
    DEFAULT 0,

    links_count INTEGER
    DEFAULT 0,

    forms_count INTEGER
    DEFAULT 0,

    tables_count INTEGER
    DEFAULT 0,

    sections_count INTEGER
    DEFAULT 0,

    headings_count INTEGER
    DEFAULT 0,

    api_count INTEGER
    DEFAULT 0
);

-- =========================================
-- CRAWL RUNS
-- =========================================

CREATE TABLE crawl_runs (

    id SERIAL PRIMARY KEY,

    root_url TEXT,

    started_at TIMESTAMPTZ
    DEFAULT NOW(),

    finished_at TIMESTAMPTZ,

    total_pages INTEGER
    DEFAULT 0
);

-- =========================================
-- CRAWL PAGES
-- =========================================

CREATE TABLE crawl_pages (

    id SERIAL PRIMARY KEY,

    crawl_run_id INTEGER

        REFERENCES crawl_runs(id)

        ON DELETE CASCADE,

    url TEXT,

    title TEXT,

    depth INTEGER,

    captured_at TIMESTAMPTZ
    DEFAULT NOW(),

    screenshot_path TEXT,

    html_path TEXT,

    dom_path TEXT,

    structured_data_path TEXT
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_captures_url
ON captures(url);

CREATE INDEX idx_captures_time
ON captures(captured_at);

CREATE INDEX idx_crawl_pages_run
ON crawl_pages(crawl_run_id);

CREATE INDEX idx_crawl_pages_url
ON crawl_pages(url);

---

## Future Enhancements

* AI-generated change summaries
* Scheduled website monitoring
* Email notifications
* PDF report generation
* Authentication profiles
* Crawl dashboards
* Automated change alerts
* Multi-user support

---

## Author

Developed as a website inspection and webpage change-tracking platform using Electron, React, Playwright, and PostgreSQL.
