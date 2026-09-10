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
        apiCalls
    });

    return result;
}