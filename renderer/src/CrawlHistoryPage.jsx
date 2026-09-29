import { useEffect, useMemo, useState } from "react";
import { prettyDate, toFileUrl } from "./formatters";

export default function CrawlHistoryPage({ goHome }) {
    const [runs, setRuns] = useState([]);
    const [selectedRunId, setSelectedRunId] = useState(null);
    const [pages, setPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);

    useEffect(() => {
        let active = true;
        window.electronAPI.getCrawlRuns().then((result) => {
            if (active && result.success) {
                setRuns(result.rows);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    const activeRunId = runs.some((run) => run.id === selectedRunId)
        ? selectedRunId
        : runs[0]?.id ?? null;

    useEffect(() => {
        if (!activeRunId) return;

        let active = true;
        window.electronAPI.getCrawlPages(activeRunId).then((result) => {
            if (active && result.success) {
                setPages(result.rows);
                setSelectedPage(null);
            }
        });

        return () => {
            active = false;
        };
    }, [activeRunId]);

    const selectedRun = useMemo(
        () => runs.find((run) => run.id === activeRunId),
        [runs, activeRunId]
    );

    const openPage = async (pageId) => {
        const result = await window.electronAPI.getCrawlPageDetails(pageId);
        if (result.success) {
            setSelectedPage(result.data);
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div
                style={{
                    width: "340px",
                    borderRight: "1px solid #334155",
                    padding: "14px",
                    overflowY: "auto"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px"
                    }}
                >
                    <h2 style={{ margin: 0 }}>Crawl History</h2>
                    <button onClick={goHome}>Home</button>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                    {runs.map((run) => (
                        <div
                            key={run.id}
                            onClick={() => setSelectedRunId(run.id)}
                            style={{
                                padding: "12px",
                                borderRadius: "10px",
                                background:
                                    selectedRunId === run.id ? "#334155" : "#1e293b",
                                cursor: "pointer"
                            }}
                        >
                            <div style={{ fontWeight: "bold" }}>
                                Crawl #{run.id}
                            </div>
                            <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
                                {run.root_url}
                            </div>
                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                Pages: {run.total_pages || 0}
                            </div>
                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                Started: {prettyDate(run.started_at)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <div
                    style={{
                        width: "360px",
                        borderRight: "1px solid #334155",
                        padding: "14px",
                        overflowY: "auto"
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>
                        Pages{selectedRun ? ` in Crawl #${selectedRun.id}` : ""}
                    </h3>

                    <div style={{ display: "grid", gap: "10px" }}>
                        {pages.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => openPage(p.id)}
                                style={{
                                    padding: "10px",
                                    borderRadius: "10px",
                                    background:
                                        selectedPage?.id === p.id
                                            ? "#475569"
                                            : "#1e293b",
                                    cursor: "pointer"
                                }}
                            >
                                <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                                    {p.title || "Untitled"}
                                </div>
                                <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
                                    {p.url}
                                </div>
                                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                    Depth: {p.depth} | {prettyDate(p.captured_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, padding: "18px", overflowY: "auto" }}>
                    {!selectedPage ? (
                        <div style={{ color: "#94a3b8" }}>
                            Select a page to inspect its capture data.
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ marginTop: 0 }}>{selectedPage.title}</h2>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "12px",
                                    marginBottom: "16px"
                                }}
                            >
                                <div className="metric-card">Depth: {selectedPage.depth}</div>
                                <div className="metric-card">Run ID: {selectedPage.crawl_run_id}</div>
                                <div className="metric-card">
                                    Captured: {prettyDate(selectedPage.captured_at)}
                                </div>
                            </div>

                            <img
                                src={toFileUrl(selectedPage.screenshot_path)}
                                alt="crawl capture"
                                style={{
                                    width: "100%",
                                    borderRadius: "10px",
                                    marginBottom: "20px"
                                }}
                            />

                            <details open>
                                <summary>Structured Data</summary>
                                <pre style={{ whiteSpace: "pre-wrap" }}>
                                    {JSON.stringify(selectedPage.structured, null, 2)}
                                </pre>
                            </details>

                            <details>
                                <summary>HTML</summary>
                                <pre style={{ whiteSpace: "pre-wrap" }}>
                                    {selectedPage.html}
                                </pre>
                            </details>

                            <details>
                                <summary>DOM Nodes</summary>
                                <pre style={{ whiteSpace: "pre-wrap" }}>
                                    {JSON.stringify(selectedPage.domNodes, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}