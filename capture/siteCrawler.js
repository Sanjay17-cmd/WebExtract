const { chromium } = require("playwright");

async function crawlWebsite(
    rootUrl,
    config,
    onPage
) {

    const browser =
        await chromium.launch({
            headless: true
        });

    const visited =
        new Set();

    const queue = [

        {
            url: rootUrl,
            depth: 0
        }
    ];

    const rootHost =
        new URL(rootUrl).hostname;

    let pagesVisited = 0;

    try {

        while (

            queue.length > 0 &&

            pagesVisited <
                config.maxPages

        ) {

            const current =
                queue.shift();

            if (

                visited.has(
                    current.url
                )

            ) {

                continue;
            }

            if (

                current.depth >
                config.maxDepth

            ) {

                continue;
            }

            visited.add(
                current.url
            );

            pagesVisited++;

            const page =
                await browser.newPage();

            try {

                await page.goto(

                    current.url,

                    {

                        waitUntil:
                            "networkidle",

                        timeout:
                            60000
                    }
                );

                await page.waitForTimeout(
                    config.delayMs
                );

                // callback
                await onPage(
                    page,
                    current.url,
                    current.depth
                );

                const links =
                    await page.evaluate(() => {

                        return [

                            ...document.querySelectorAll(
                                "a[href]"
                            )

                        ].map(

                            a => a.href
                        );
                    });

                for (

                    const href
                    of links

                ) {

                    try {

                        const parsed =
                            new URL(
                                href
                            );

                        if (

                            !config.allowExternal

                        ) {

                            if (

                                parsed.hostname !==
                                rootHost

                            ) {

                                continue;
                            }
                        }

                        if (

                            !visited.has(
                                parsed.href
                            )

                        ) {

                            queue.push({

                                url:
                                    parsed.href,

                                depth:
                                    current.depth + 1
                            });
                        }

                    } catch {}
                }

            } catch (

                err

            ) {

                console.error(

                    "Crawler Error:",

                    current.url,

                    err.message
                );
            }

            await page.close();
        }

    } finally {

        await browser.close();
    }

    return {

        pagesVisited
    };
}

module.exports = {

    crawlWebsite
};