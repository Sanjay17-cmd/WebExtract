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
        webContentsId
    });

    return result;
}