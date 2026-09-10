async function extractPageData(page) {

    return await page.evaluate(() => {

        const truncate = (

            value,

            len = 100

        ) =>

            String(value || "")

            .replace(/\s+/g, " ")

            .trim()

            .slice(0, len);

        const buttons =

            [...document.querySelectorAll("button")]

            .map(btn => ({

                text:

                    truncate(

                        btn.innerText
                    ),

                id:

                    btn.id || ""
            }));

        const links =

            [...document.querySelectorAll("a")]

            .map(link => ({

                text:

                    truncate(

                        link.innerText
                    ),

                href:

                    link.href || ""
            }));

        const forms =

            [...document.querySelectorAll("form")]

            .map(form => ({

                action:

                    form.action || "",

                method:

                    form.method || ""
            }));

        const tables =

            [...document.querySelectorAll("table")]

            .map(table => ({

                rows:

                    table.rows.length
            }));

        const headings =

            [...document.querySelectorAll(

                "h1,h2,h3,h4,h5,h6"

            )]

            .map(h => ({

                tag:

                    h.tagName,

                text:

                    truncate(
                        h.innerText
                    )
            }));

        return {

            title:

                document.title,

            html:

                document.documentElement
                .outerHTML,

            buttons,

            links,

            forms,

            tables,

            headings,

            domNodes:

                document
                .querySelectorAll("*")
                .length
        };

    });

}

module.exports = {

    extractPageData
};