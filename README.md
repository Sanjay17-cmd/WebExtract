# WebExtract 🚀 (Windows Edition)

WebExtract is a desktop application built with Electron, React (Vite), Playwright, and PostgreSQL for web capturing, crawling, visual diff comparison, and structured web data extraction.

---

## 📌 Prerequisites

Before running the application on a fresh system, ensure you have installed:

1. **Node.js** (v18.x or later): [Download Node.js](https://nodejs.org/)
2. **PostgreSQL** (v12.x or later): [Download PostgreSQL](https://www.postgresql.org/download/)
   - Default Database Name: `postgres`
   - Default User: `postgres`
   - Default Port: `5432`
   - Set password to: `root` (or update in `storage/postgres.js`)

---

## 🛠️ Installation Instructions for a Fresh System

Follow these steps sequentially on a fresh machine:

### 1. Clone the Repository
```bash
git clone https://github.com/Sanjay17-cmd/WebExtract.git
cd WebExtract
```

### 2. Install Root & Renderer Dependencies
Run `npm install` in both the root directory and the `renderer` subfolder:

```bash
# Install root dependencies
npm install

# Install renderer UI dependencies
cd renderer
npm install
cd ..
```

### 3. Install Playwright Browsers
Install the required Chromium browser binaries for page capture & crawling:

```bash
npx playwright install chromium
```

---

## 🗄️ Database Setup

### Option A: Automatic Initialization (Recommended)
The app automatically initializes the database and creates all required tables (`captures`, `crawl_runs`, `crawl_pages`) on startup.

### Option B: Manual SQL Execution
If you prefer to execute the database schema manually in **pgAdmin**, **psql**, or **DBeaver**, use the included `schema.sql` file:

```bash
# Using psql (Command Line)
psql -U postgres -d postgres -f schema.sql
```

Or copy and execute the contents of [schema.sql](file:///c:/Users/sanja/Downloads/webextract/schema.sql) directly in your PostgreSQL client.

---

## 🚀 Running the Application

To start the Vite frontend and Electron desktop app concurrently:

```bash
npm run dev
```

---

## 📂 Project Structure

```
WebExtract/
├── capture/               # Playwright page capture & crawling engine
├── electron/              # Electron main process & IPC handlers
├── renderer/              # React + Vite frontend application
│   └── src/               # React pages (History, Compare, Crawl, etc.)
├── storage/               # PostgreSQL connection & table schema
├── schema.sql             # Standalone SQL schema for manual DB setup
├── package.json           # Application dependencies & scripts
└── README.md              # Documentation
```

---

## 🏷️ Version
- **Tag**: `v1.0.0-windows` (Windows Verified Release)
