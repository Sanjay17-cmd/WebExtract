import {

    useEffect,
    useRef,
    useState

} from "react";

import {

    saveCapture

} from "./captureStorage";

import HistoryPage from "./HistoryPage";

import "./App.css";

export default function App() {

    // =====================================
    // STATES
    // =====================================

    const [url, setUrl] = useState(
        "https://example.com"
    );

    const [page, setPage] =
    useState("home");

    const [currentUrl, setCurrentUrl] =
        useState(
            "https://example.com"
        );

    const [metrics, setMetrics] =
        useState({

            buttons: 0,
            links: 0,
            forms: 0,
            tables: 0,
            sections: 0,
            domNodes: 0
        });

    const [domNodes, setDomNodes] =
        useState([]);

    // =====================================
    // WEBVIEW REF
    // =====================================

    const webviewRef = useRef(null);

    // =====================================
    // OPEN WEBSITE
    // =====================================

    const openWebsite = () => {

        if (

            !url.startsWith("http")
        ) {

            const formatted =
                "https://" + url;

            setCurrentUrl(formatted);

            return;
        }

        setCurrentUrl(url);
    };

    // =====================================
    // ENTER KEY SUPPORT
    // =====================================

    const handleKeyDown = (e) => {

        if (e.key === "Enter") {

            openWebsite();
        }
    };

    // =====================================
    // UPDATE URL ON NAVIGATION
    // =====================================

    useEffect(() => {

        const webview =
            webviewRef.current;

        if (!webview)
            return;

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

    }, []);

    // =====================================
    // CAPTURE PAGE
    // =====================================

    const capturePage = async () => {

        if (!webviewRef.current)
            return;

        try {

            const data =
                await webviewRef.current
                .executeJavaScript(`

                (() => {

                    return {

                        domNodes: (() => {

    const nodes = [];

    let nodeId = 0;

    function walk(

        element,

        parentId = null,

        depth = 0
    ) {

        if (nodes.length > 400)
            return;

        const currentId = nodeId++;

        const attributes = {};

        for (

            const attr of element.attributes || []

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
                ?.toLowerCase() || "",

            idAttr:

                element.id || "",

            classAttr:

                element.className || "",

            text: "",

            attributes
        });

        for (

            const child of element.children || []

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

})(),

                        metrics: {

                            buttons:
                                document
                                .querySelectorAll(
                                    "button"
                                ).length,

                            links:
                                document
                                .querySelectorAll(
                                    "a"
                                ).length,

                            forms:
                                document
                                .querySelectorAll(
                                    "form"
                                ).length,

                            tables:
                                document
                                .querySelectorAll(
                                    "table"
                                ).length,

                            sections:
                                document
                                .querySelectorAll(
                                    "section"
                                ).length,

                            domNodes:
                                document
                                .querySelectorAll("*")
                                .length
                        }
                    };

                })();

            `);

            setMetrics(
                data.metrics
            );

            setDomNodes(
                data.domNodes
            );
            const captureData =
    await saveCapture(

        webviewRef.current,

        data.metrics,

        data.domNodes
    );

console.log(
    "Saved:",
    captureData
);

        } catch (err) {

            console.error(err);
        }
    };

    return (

        <div className="app">

            {/* ========================= */}
            {/* TOPBAR */}
            {/* ========================= */}

            <div className="topbar">

                <div className="logo">

                    WEBEXTRACT

                </div>

                <input

                    className="url-input"

                    value={url}

                    onChange={(e) =>

                        setUrl(
                            e.target.value
                        )
                    }

                    onKeyDown={
                        handleKeyDown
                    }
                />

                <button

                    className="action-btn"

                    onClick={openWebsite}
                >

                    Open

                </button>

                <button

                    className="action-btn"

                    onClick={capturePage}
                >

                    Capture

                </button>

                <button

    className="action-btn"

    onClick={() =>

        setPage("history")
    }
>

    History

</button>

                <button className="action-btn">

                    Compare

                </button>

            </div>

            {/* ========================= */}
            {/* MAIN */}
            {/* ========================= */}
{

    page === "home"

    &&

    (

        <div className="main-layout">

            {/* ===================== */}
            {/* LEFT */}
            {/* ===================== */}

            <div className="left-panel">

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

                            DOM Nodes:
                            {" "}

                            {metrics.domNodes}

                        </div>

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


{

    page === "history"

    &&

    <HistoryPage />
}

        </div>
    );
}