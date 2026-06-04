const { session } = require("electron");

async function getElectronCookies(url){
    const cookies =
        await session
        .defaultSession
        .cookies
        .get({
            url
        });
    return cookies.map(
        c => ({
            name:
                c.name,
            value:
                c.value,
            domain:
                c.domain,
            path:
                c.path,
            expires:
                c.expirationDate,
            httpOnly:
                c.httpOnly,
            secure:
                c.secure,
            sameSite:c.sameSite ||
    "Lax"
        })
    );
}
module.exports = {getElectronCookies};