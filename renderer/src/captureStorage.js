export async function saveCapture(
    webview,
    metrics,
    domNodes,
    buttons,
    links,
    forms,
    tables,
    headings,
    sections,
    apiCalls
) {
    const html = await webview.executeJavaScript(`
        document.documentElement.outerHTML
    `);

    const title = await webview.executeJavaScript(`
        document.title
    `);

    const browserState = await webview.executeJavaScript(`
        (() => {
            const readStorage = (storage) => {
                const values = {};
                for (let index = 0; index < storage.length; index += 1) {
                    const key = storage.key(index);
                    values[key] = storage.getItem(key);
                }
                return values;
            };
            const safeReadStorage = (name) => {
                try {
                    return readStorage(window[name]);
                } catch (_) {
                    return {};
                }
            };

            return {
                localStorage: safeReadStorage("localStorage"),
                sessionStorage: safeReadStorage("sessionStorage")
            };
        })()
    `);

    const url = webview.getURL();

    // Get the webContentsId so the main process can capture
    // the EXACT webview the user is looking at
    const webContentsId = webview.getWebContentsId();

    const result = await window.electronAPI.saveCapture({
        url,
        title,
        html,
        metrics,
        domNodes,
        buttons,
        links,
        forms,
        tables,
        headings,
        sections,
        apiCalls,
        webContentsId,
        browserState
    });

    return result;
}