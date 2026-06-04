const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    saveCapture: (data) =>
        ipcRenderer.invoke("save-capture", data),

    startCrawl: (config) =>
        ipcRenderer.invoke("start-crawl", config),

    getCrawlRuns: () =>
        ipcRenderer.invoke("get-crawl-runs"),

    getCrawlPages: (crawlRunId) =>
        ipcRenderer.invoke("get-crawl-pages", crawlRunId),

    getCrawlPageDetails: (pageId) =>
        ipcRenderer.invoke("get-crawl-page-details", pageId),

    getHistory: () =>
        ipcRenderer.invoke("get-history"),

    summarizeComparison: (payload) =>
    ipcRenderer.invoke("summarize-comparison", payload),

    getCaptureDetails: (id) =>
        ipcRenderer.invoke("get-capture-details", id)
});