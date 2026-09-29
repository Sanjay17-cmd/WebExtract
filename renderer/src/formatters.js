export function toFileUrl(filePath) {
    if (!filePath) return "";
    if (filePath.startsWith("file://")) return filePath;

    const normalized = filePath.replace(/\\/g, "/");
    return normalized.startsWith("/") ? `file://${normalized}` : `file:///${normalized}`;
}

export function prettyDate(value) {
    try {
        return new Date(value).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "medium"
        });
    } catch {
        return String(value || "");
    }
}