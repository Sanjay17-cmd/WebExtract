import { useRef, useState } from "react";

import "./App.css";

export default function App() {

    // =====================================
    // STATES
    // =====================================

    const [url, setUrl] = useState(
        "https://example.com"
    );

    const [metrics, setMetrics] = useState({

        buttons: 0,
        links: 0,
        forms: 0,
        tables: 0,
        sections: 0,
        domNodes: 0
    });

    const [htmlPreview, setHtmlPreview] =
        useState("");

    // =====================================
    // WEBVIEW REF
    // =====================================

    const webviewRef = useRef(null);

    // =====================================
    // OPEN WEBSITE
    // =====================================

    const openWebsite = () => {

        if (

            webviewRef.current

            &&

            url
        ) {

            webviewRef.current.src = url;
        }
    };

    // =====================================
    // CAPTURE PAGE
    // =====================================

    const capturePage = async () => {

        if (!webviewRef.current)
            return;

        // ---------------------------------
        // EXECUTE INSIDE WEBVIEW
        // ---------------------------------

        const data =
            await webviewRef.current
            .executeJavaScript(`

            (() => {

                return {

                    html:
                        document
                        .documentElement
                        .outerHTML,

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

        // ---------------------------------
        // UPDATE UI
        // ---------------------------------

        setMetrics(data.metrics);

        setHtmlPreview(
            data.html.slice(0, 8000)
        );
    };

    return (

        <div className="app">

            {/* ============================= */}
            {/* TOPBAR */}
            {/* ============================= */}

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

                <button className="action-btn">

                    History

                </button>

                <button className="action-btn">

                    Compare

                </button>

            </div>

            {/* ============================= */}
            {/* MAIN */}
            {/* ============================= */}

            <div className="main-layout">

                {/* ========================= */}
                {/* LEFT */}
                {/* ========================= */}

                <div className="left-panel">

                    {/* ===================== */}
                    {/* HTML TREE */}
                    {/* ===================== */}

                    <div className="panel">

                        <h3>

                            HTML PREVIEW

                        </h3>

                        <div className="tree-box">

                            <pre>

                                {htmlPreview}

                            </pre>

                        </div>

                    </div>

                    {/* ===================== */}
                    {/* SUMMARY */}
                    {/* ===================== */}

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

                {/* ========================= */}
                {/* RIGHT */}
                {/* ========================= */}

                <div className="right-panel">

                    <webview

                        ref={webviewRef}

                        src={url}

                        style={{

                            width: "100%",

                            height: "100%"
                        }}
                    />

                </div>

            </div>

        </div>
    );
}