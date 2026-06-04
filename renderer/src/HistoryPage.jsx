import { useEffect, useState } from "react";

function toFileUrl(p) {
    if (!p) return "";
    if (p.startsWith("file://")) return p;
    return `file://${p}`;
}

export default function HistoryPage({ goHome }) {
    const [history, setHistory] = useState([]);
    const [selectedCapture, setSelectedCapture] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const result = await window.electronAPI.getHistory();

        if (result.success) {
            setHistory(result.rows);
        }
    };

    const openCapture = async (id) => {
        const result = await window.electronAPI.getCaptureDetails(id);

        if (result.success) {
            setSelectedCapture(result.data);
        }
    };

    const structured = selectedCapture?.structured || {};

    return (
        <div
            style={{
                display: "flex",
                height: "100%"
            }}
        >
            <div
                style={{
                    width: "320px",
                    borderRight: "1px solid #334155",
                    overflowY: "auto",
                    padding: "12px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                >
                    <h2>History</h2>

                    <button
                        onClick={goHome}
                        style={{
                            padding: "8px 14px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#2563eb",
                            color: "white",
                            cursor: "pointer"
                        }}
                    >
                        Home
                    </button>
                </div>

                {history.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => openCapture(item.id)}
                        style={{
                            padding: "12px",
                            marginTop: "10px",
                            background: "#1e293b",
                            borderRadius: "8px",
                            cursor: "pointer"
                        }}
                    >
                        <div>{item.title}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {item.url}
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    flex: 1,
                    padding: "16px",
                    overflowY: "auto"
                }}
            >
                {selectedCapture && (
                    <div>
                        <h2>{selectedCapture.title}</h2>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "12px",
                                marginTop: "16px"
                            }}
                        >
                            <div className="metric-card">Buttons: {selectedCapture.buttons_count}</div>
                            <div className="metric-card">Links: {selectedCapture.links_count}</div>
                            <div className="metric-card">Forms: {selectedCapture.forms_count}</div>
                            <div className="metric-card">Tables: {selectedCapture.tables_count}</div>
                            <div className="metric-card">Sections: {selectedCapture.sections_count}</div>
                            <div className="metric-card">Headings: {selectedCapture.headings_count}</div>
                            <div className="metric-card">API Calls: {selectedCapture.api_count}</div>
                            <div className="metric-card">DOM Nodes: {selectedCapture.dom_nodes}</div>
                        </div>

                        <img
                            src={toFileUrl(selectedCapture.screenshot_path)}
                            alt="capture"
                            style={{
                                width: "100%",
                                marginTop: "20px",
                                borderRadius: "10px"
                            }}
                        />

                        <div style={{ marginTop: "24px" }}>
                            <h3>Structured Data</h3>

                            <details>
                                <summary>Buttons</summary>
                                <pre>{JSON.stringify(structured.buttons || [], null, 2)}</pre>
                            </details>

                            <details>
                                <summary>Links</summary>
                                <pre>{JSON.stringify(structured.links || [], null, 2)}</pre>
                            </details>

                            <details>
                                <summary>Forms</summary>
                                <pre>{JSON.stringify(structured.forms || [], null, 2)}</pre>
                            </details>

                            <details>
                                <summary>Tables</summary>
                                <pre>{JSON.stringify(structured.tables || [], null, 2)}</pre>
                            </details>

                            <details>
                                <summary>Sections</summary>
                                <pre>{JSON.stringify(structured.sections || [], null, 2)}</pre>
                            </details>

                            <details>
                                <summary>Headings</summary>
                                <pre>{JSON.stringify(structured.headings || [], null, 2)}</pre>
                            </details>

                            <details>
                                <summary>API Calls</summary>
                                <pre>{JSON.stringify(structured.apiCalls || [], null, 2)}</pre>
                            </details>
                        </div>

                        <div style={{ marginTop: "24px" }}>
                            <h3>DOM Tree</h3>
                            <pre style={{ whiteSpace: "pre-wrap" }}>
                                {JSON.stringify((selectedCapture.domNodes || []).slice(0, 120), null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}