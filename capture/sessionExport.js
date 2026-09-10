const { session } = require("electron");

function normalizeSameSite(value) {
    const v = String(value || "").toLowerCase();

    if (v === "strict") return "Strict";
    if (v === "lax") return "Lax";
    if (v === "none") return "None";

    return undefined;
}

async function getElectronCookies(url) {
    const cookies = await session.defaultSession.cookies.get({ url });

    return cookies.map((c) => {
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