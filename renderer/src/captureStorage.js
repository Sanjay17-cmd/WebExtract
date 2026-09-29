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
        (() => {
            const snapshot = document.documentElement.cloneNode(true);
            const sourceImages = [...document.images];
            const snapshotImages = [...snapshot.querySelectorAll("img")];

            sourceImages.forEach((image, index) => {
                const snapshotImage = snapshotImages[index];
                if (!snapshotImage) return;

                const source = image.currentSrc || image.src;
                if (source) snapshotImage.setAttribute("src", source);
                snapshotImage.removeAttribute("srcset");
                snapshotImage.removeAttribute("loading");
            });

            return snapshot.outerHTML;
        })()
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