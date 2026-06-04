export async function saveCapture(

    webview,

    metrics,

    domNodes
) {

    // ====================================
    // HTML
    // ====================================

    const html =
        await webview.executeJavaScript(`

        document.documentElement.outerHTML

    `);

    // ====================================
    // TITLE
    // ====================================

    const title =
        await webview.executeJavaScript(`

        document.title

    `);

    // ====================================
    // URL
    // ====================================

    const url =
        webview.getURL();

    // ====================================
    // SAVE THROUGH IPC
    // ====================================

    const result =
        await window.electronAPI
        .saveCapture({

            url,

            title,

            html,

            metrics,

            domNodes
        });

    return result;
}