import { useEffect, useRef, useState } from "react";
import CrawlHistoryPage from "./CrawlHistoryPage";
import { saveCapture } from "./captureStorage";
import HistoryPage from "./HistoryPage";
import ComparePage from "./ComparePage";

import "./App.css";

export default function App() {

    // =====================================================
    // STATES
    // =====================================================


    const [

    allowExternal,

    setAllowExternal

] = useState(false);

const [

    restrictPath,

    setRestrictPath

] = useState(true);

const [

    maxDepth,

    setMaxDepth

] = useState(3);

const [

    maxPages,

    setMaxPages

] = useState(50);

const [

    crawlDelay,

    setCrawlDelay

] = useState(1000);

    const [url, setUrl] =
        useState("https://google.com");

    const [page, setPage] =
        useState("home");

    const [currentUrl, setCurrentUrl] =
        useState("https://google.com");

    const [bulkUrls, setBulkUrls] =
        useState("");

    const [isBulkRunning, setIsBulkRunning] =
        useState(false);

    const [bulkStatus, setBulkStatus] =
        useState("");

    const [metrics, setMetrics] =
        useState({

            buttons: 0,
            links: 0,
            forms: 0,
            tables: 0,
            sections: 0,
            headings: 0,
            apiCalls: 0,
            domNodes: 0
        });

    const [domNodes, setDomNodes] =
        useState([]);

    const webviewRef = useRef(null);

    // =====================================================
    // OPEN WEBSITE
    // =====================================================

    const openWebsite = () => {

        if (!url.trim()) return;

        const formatted =
            url.startsWith("http")

                ? url

                : `https://${url.trim()}`;

        setUrl(formatted);

        setCurrentUrl(formatted);
    };

    // =====================================================
    // ENTER KEY
    // =====================================================

    const handleKeyDown = (e) => {

        if (e.key === "Enter") {

            openWebsite();
        }
    };

    // =====================================================
    // UPDATE URL FROM WEBVIEW
    // =====================================================

    useEffect(() => {

        if (page !== "home") return;

        const webview =
            webviewRef.current;

        if (!webview) return;

        const updateUrl = () => {

            setUrl(

                webview.getURL()
            );
        };

        webview.addEventListener(

            "did-navigate",

            updateUrl
        );

        webview.addEventListener(

            "did-navigate-in-page",

            updateUrl
        );

        return () => {

            webview.removeEventListener(

                "did-navigate",

                updateUrl
            );

            webview.removeEventListener(

                "did-navigate-in-page",

                updateUrl
            );
        };

    }, [page]);

    // =====================================================
    // WAIT HELPER
    // =====================================================

    const wait = (ms) =>

        new Promise((resolve) =>

            setTimeout(resolve, ms)
        );

    // =====================================================
    // CAPTURE PAGE
    // =====================================================

    const capturePage = async () => {

        if (!webviewRef.current) return;

        try {

            const data =
                await webviewRef.current
                .executeJavaScript(`

                (() => {

                    const truncate = (

                        value,

                        len = 80

                    ) =>

                        String(value || "")

                        .replace(/\\s+/g, " ")

                        .trim()

                        .slice(0, len);

                    // ====================================
                    // DOM TREE
                    // ====================================

                    const flattenDom = () => {

                        const nodes = [];

                        let nodeId = 0;

                        function walk(

                            element,

                            parentId = null,

                            depth = 0

                        ) {

                            if (

                                nodes.length >= 400
                            ) return;

                            const currentId =
                                nodeId++;

                            const attributes = {};

                            for (

                                const attr of

                                element.attributes || []

                            ) {

                                attributes[attr.name] =
                                    attr.value;
                            }

                            nodes.push({

                                id: currentId,

                                parentId,

                                depth,

                                tag:

                                    element.tagName

                                    ? element.tagName
                                      .toLowerCase()

                                    : "",

                                idAttr:
                                    element.id || "",

                                classAttr:
                                    String(
                                        element.className || ""
                                    ),

                                text: "",

                                attributes
                            });

                            for (

                                const child of

                                element.children || []

                            ) {

                                walk(

                                    child,

                                    currentId,

                                    depth + 1
                                );
                            }
                        }

                        walk(
                            document.documentElement
                        );

                        return nodes;
                    };

                    // ====================================
                    // BUTTONS
                    // ====================================

                    const buttons =

                        Array.from(

                            document.querySelectorAll(
                                "button"
                            )

                        ).map((btn) => ({

                            text:

                                truncate(
                                    btn.innerText,
                                    80
                                ),

                            id:
                                btn.id || "",

                            className:

                                String(
                                    btn.className || ""
                                ),

                            type:
                                btn.type || ""
                        }));

                    // ====================================
                    // LINKS
                    // ====================================

                    const links =

                        Array.from(

                            document.querySelectorAll(
                                "a"
                            )

                        ).map((link) => ({

                            text:

                                truncate(
                                    link.innerText,
                                    80
                                ),

                            href:
                                link.href || ""
                        }));

                    // ====================================
                    // FORMS
                    // ====================================

                    const forms =

                        Array.from(

                            document.querySelectorAll(
                                "form"
                            )

                        ).map((form) => ({

                            action:
                                form.action || "",

                            method:
                                form.method || "",

                            inputCount:

                                form.querySelectorAll(

                                    "input, select, textarea"

                                ).length
                        }));

                    // ====================================
                    // TABLES
                    // ====================================

                    const tables =

                        Array.from(

                            document.querySelectorAll(
                                "table"
                            )

                        ).map((table) => ({

                            rows:
                                table.rows.length,

                            columns:

                                table.rows[0]
                                ?.cells.length || 0
                        }));

                    // ====================================
                    // SECTIONS
                    // ====================================

                    const sections =

                        Array.from(

                            document.querySelectorAll(

                                "section, article, aside, [role='main']"

                            )

                        ).map((sec) => ({

                            tag:

                                sec.tagName
                                .toLowerCase(),

                            id:
                                sec.id || "",

                            heading:

                                truncate(

                                    sec.querySelector(

                                        'h1, h2, h3'

                                    )?.innerText || "",

                                    120
                                )
                        }));

                    // ====================================
                    // HEADINGS
                    // ====================================

                    const headings =

                        Array.from(

                            document.querySelectorAll(

                                "h1,h2,h3,h4,h5,h6"

                            )

                        ).map((heading) => ({

                            tag:

                                heading.tagName
                                .toLowerCase(),

                            text:

                                truncate(

                                    heading.innerText || "",

                                    120
                                )
                        }));

                    // ====================================
                    // API CALLS
                    // ====================================

                    const apiCalls =

                        performance

                        .getEntriesByType(
                            "resource"
                        )

                        .filter((r) =>

                            [

                                "fetch",

                                "xmlhttprequest"

                            ]

                            .includes(

                                String(

                                    r.initiatorType || ""

                                ).toLowerCase()
                            )
                        )

                        .map((r) => ({

                            name:
                                r.name,

                            initiatorType:
                                r.initiatorType,

                            duration:

                                Math.round(
                                    r.duration
                                )
                        }));

                    // ====================================
                    // RETURN
                    // ====================================

                    return {

                        domNodes:

                            flattenDom(),

                        buttons,

                        links,

                        forms,

                        tables,

                        sections,

                        headings,

                        apiCalls,

                        metrics: {

                            buttons:
                                buttons.length,

                            links:
                                links.length,

                            forms:
                                forms.length,

                            tables:
                                tables.length,

                            sections:
                                sections.length,

                            headings:
                                headings.length,

                            apiCalls:
                                apiCalls.length,

                            domNodes:

                                document
                                .querySelectorAll("*")
                                .length
                        }
                    };

                })();

            `);

            setMetrics(data.metrics);

            setDomNodes(data.domNodes);

            const captureData =
                await saveCapture(

                    webviewRef.current,

                    data.metrics,

                    data.domNodes,

                    data.buttons,

                    data.links,

                    data.forms,

                    data.tables,

                    data.headings,

                    data.sections,

                    data.apiCalls
                );

            console.log(
                "Saved:",
                captureData
            );

        } catch (err) {

            console.error(err);
        }
    };

    // =====================================================
    // BULK CAPTURE
    // =====================================================

    const startBulkCapture = async () => {

        if (!bulkUrls.trim()) return;

        const urls =

            bulkUrls

            .split(",")

            .map((u) => u.trim())

            .filter(Boolean);

        if (urls.length === 0) return;

        setIsBulkRunning(true);

        try {

            for (

                let i = 0;

                i < urls.length;

                i++
            ) {

                let nextUrl = urls[i];

                if (

                    !nextUrl.startsWith("http")
                ) {

                    nextUrl =
                        `https://${nextUrl}`;
                }

                setBulkStatus(

                    `Processing ${i + 1}/${urls.length} : ${nextUrl}`
                );

                setCurrentUrl(nextUrl);

                setUrl(nextUrl);

                // ====================================
                // WAIT FOR PAGE LOAD
                // ====================================

                await wait(4000);

                // ====================================
                // CAPTURE
                // ====================================

                await capturePage();

                // ====================================
                // SMALL DELAY
                // ====================================

                await wait(1000);
            }

            setBulkStatus(
                "Bulk capture completed"
            );

        } catch (err) {

            console.error(err);

            setBulkStatus(
                "Bulk capture failed"
            );

        } finally {

            setIsBulkRunning(false);
        }
    };


    // =====================================================
// SITE CRAWLER
// =====================================================

const startSiteCrawl = async () => {

    try {

        const result =
            await window
            .electronAPI
            .startCrawl({

                url,

                allowExternal,

                restrictPath,

                maxDepth,

                maxPages,

                delayMs: crawlDelay
            });

        console.log(
            "Crawler Result:",
            result
        );

    } catch (err) {

        console.error(
            err
        );
    }
};



    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="app">

            {/* ================================= */}
            {/* TOPBAR */}
            {/* ================================= */}

            <div className="topbar">

                <div className="logo">

                    WEBEXTRACT

                </div>

                <input

                    className="url-input"

                    value={url}

                    onChange={(e) =>

                        setUrl(e.target.value)
                    }

                    onKeyDown={handleKeyDown}

                    disabled={

                        page !== "home"
                    }
                />

                <button

                    className="action-btn"

                    onClick={openWebsite}

                    disabled={

                        page !== "home"
                    }
                >

                    Open

                </button>

                <button

                    className="action-btn"

                    onClick={capturePage}

                    disabled={

                        page !== "home"
                    }
                >

                    Capture

                </button>
<button

    className="action-btn"

    onClick={startSiteCrawl}

>

    Crawl Site

</button>
<button
    className="action-btn"
    onClick={() => setPage("crawl-history")}
>
    Crawl History
</button>
                <button

                    className="action-btn"

                    onClick={() =>

                        setPage("history")
                    }
                >

                    History

                </button>

                <button

                    className="action-btn"

                    onClick={() =>

                        setPage("compare")
                    }
                >

                    Compare

                </button>

            </div>

            {/* ================================= */}
            {/* HOME PAGE */}
            {/* ================================= */}

            {

                page === "home" && (

                    <div className="main-layout">

                        {/* ===================== */}
                        {/* LEFT */}
                        {/* ===================== */}

                        <div className="left-panel">

                            {/* ================= */}
                            {/* BULK URL INPUT */}
                            {/* ================= */}

                            <div className="panel">

                                <h3>

                                    Bulk URL Capture

                                </h3>

                                <textarea

                                    value={bulkUrls}

                                    onChange={(e) =>

                                        setBulkUrls(

                                            e.target.value
                                        )
                                    }

                                    placeholder=

                                    "google.com, github.com, youtube.com"

                                    style={{

                                        width: "100%",

                                        height: "100px",

                                        background: "#111827",

                                        color: "white",

                                        border:

                                            "1px solid #334155",

                                        borderRadius: "8px",

                                        padding: "10px"
                                    }}
                                />

                                <button

                                    className="action-btn"

                                    onClick={

                                        startBulkCapture
                                    }

                                    disabled={
                                        isBulkRunning
                                    }

                                    style={{

                                        marginTop: "10px"
                                    }}
                                >

                                    {

                                        isBulkRunning

                                        ? "Running..."

                                        : "Start Bulk Capture"
                                    }

                                </button>

                                <div

                                    style={{

                                        marginTop: "10px",

                                        fontSize: "13px",

                                        color: "#94a3b8"
                                    }}
                                >

                                    {bulkStatus}

                                </div>

                            </div>

                            {/* ================= */}
                            {/* HTML TREE */}
                            {/* ================= */}

                            <div className="panel">

                                <h3>

                                    HTML TREE

                                </h3>

                                <div className="tree-box">

                                    {

                                        domNodes

                                        .slice(0, 250)

                                        .map((node) => (

                                            <div

                                                key={node.id}

                                                style={{

                                                    paddingLeft:

                                                        `${node.depth * 16}px`
                                                }}
                                            >

                                                {"<"}

                                                {node.tag}

                                                {">"}

                                            </div>
                                        ))
                                    }

                                </div>

                            </div>

                            {/* ================= */}
                            {/* SUMMARY */}
                            {/* ================= */}

                            <div className="panel">

                                <h3>

                                    SUMMARY

                                </h3>

                                <div className="summary-grid">

                                    <div className="metric-card">

                                        Buttons:
                                        {" "}
                                        {metrics.buttons}

                                    </div>

                                    <div className="metric-card">

                                        Links:
                                        {" "}
                                        {metrics.links}

                                    </div>

                                    <div className="metric-card">

                                        Forms:
                                        {" "}
                                        {metrics.forms}

                                    </div>

                                    <div className="metric-card">

                                        Tables:
                                        {" "}
                                        {metrics.tables}

                                    </div>

                                    <div className="metric-card">

                                        Sections:
                                        {" "}
                                        {metrics.sections}

                                    </div>

                                    <div className="metric-card">

                                        Headings:
                                        {" "}
                                        {metrics.headings}

                                    </div>

                                    <div className="metric-card">

                                        API Calls:
                                        {" "}
                                        {metrics.apiCalls}

                                    </div>

                                    <div className="metric-card">

                                        DOM Nodes:
                                        {" "}
                                        {metrics.domNodes}

                                    </div>

                                </div>

                            </div>
<div className="panel">

    <h3>

        CRAWLER SETTINGS

    </h3>

    <div
        style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        }}
    >

        <label>

            Allow External Links

            <input

                type="checkbox"

                checked={allowExternal}

                onChange={(e) =>

                    setAllowExternal(
                        e.target.checked
                    )
                }
            />

        </label>
<label>

    <input

        type="checkbox"

        checked={restrictPath}

        onChange={(e) =>

            setRestrictPath(
                e.target.checked
            )
        }
    />

    Restrict To Starting Path

</label>
        <label>

            Max Depth

            <input

                type="number"

                value={maxDepth}

                onChange={(e) =>

                    setMaxDepth(
                        Number(
                            e.target.value
                        )
                    )
                }
            />

        </label>

        <label>

            Max Pages

            <input

                type="number"

                value={maxPages}

                onChange={(e) =>

                    setMaxPages(
                        Number(
                            e.target.value
                        )
                    )
                }
            />

        </label>

        <label>

            Delay (ms)

            <input

                type="number"

                value={crawlDelay}

                onChange={(e) =>

                    setCrawlDelay(
                        Number(
                            e.target.value
                        )
                    )
                }
            />

        </label>

    </div>

</div>
                        </div>

                        {/* ===================== */}
                        {/* RIGHT */}
                        {/* ===================== */}

                        <div className="right-panel">

                            <webview

                                ref={webviewRef}

                                src={currentUrl}

                                allowpopups="true"

                                style={{

                                    width: "100%",

                                    height: "100%"
                                }}
                            />

                        </div>

                    </div>
                )
            }

            {/* ================================= */}
            {/* HISTORY */}
            {/* ================================= */}
{page === "crawl-history" && (
    <CrawlHistoryPage goHome={() => setPage("home")} />
)}
            {

                page === "history" && (

                    <HistoryPage

                        goHome={() =>

                            setPage("home")
                        }
                    />
                )
            }

            {/* ================================= */}
            {/* COMPARE */}
            {/* ================================= */}

            {

                page === "compare" && (

                    <ComparePage

                        goHome={() =>

                            setPage("home")
                        }
                    />
                )
            }

        </div>
    );
}