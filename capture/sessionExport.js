const { session } = require("electron");

function normalizeSameSite(value) {
    const v = String(value || "").toLowerCase();

    if (v === "strict") return "Strict";
    if (v === "lax") return "Lax";
    if (v === "none") return "None";

    return undefined;
}

/**
 * Extract all active session and persistent cookies from Electron's session
 * matching the target URL domain.
 *
 * @param {string} targetUrl - The target URL (e.g. https://www.linkedin.com/feed/)
 * @returns {Promise<Array>} List of Playwright-compatible cookie objects
 */
async function getElectronCookies(targetUrl) {
    let hostname = "";
    try {
        hostname = new URL(targetUrl).hostname;
    } catch (_) {}

    // Retrieve all cookies from Electron default session
    const allCookies = await session.defaultSession.cookies.get({});

    // Filter cookies matching the target domain or parent domain
    const domainCookies = allCookies.filter((c) => {
        if (!hostname) return true;
        const cookieDomain = c.domain.startsWith(".") ? c.domain.slice(1) : c.domain;
        return hostname === cookieDomain || hostname.endsWith("." + cookieDomain);
    });

    return domainCookies.map((c) => {
        const cookie = {
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path || "/",
            expires:
                typeof c.expirationDate === "number"
                    ? c.expirationDate
                    : undefined,
            httpOnly: !!c.httpOnly,
            secure: !!c.secure
        };

        const sameSite = normalizeSameSite(c.sameSite);
        if (sameSite) {
            cookie.sameSite = sameSite;
        }

        return cookie;
    });
}

module.exports = {
    getElectronCookies
};