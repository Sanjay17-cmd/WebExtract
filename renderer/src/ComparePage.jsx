import { useEffect, useMemo, useState } from "react";

function toFileUrl(p) {
    if (!p) return "";
    if (p.startsWith("file://")) return p;
    return `file://${p}`;
}

function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function diffCollection(listA = [], listB = [], signatureFn) {
    const countA = new Map();
    const countB = new Map();
    const sampleA = new Map();
    const sampleB = new Map();

    listA.forEach((item) => {
        const key = signatureFn(item);
        countA.set(key, (countA.get(key) || 0) + 1);
        if (!sampleA.has(key)) sampleA.set(key, item);
    });

    listB.forEach((item) => {
        const key = signatureFn(item);
        countB.set(key, (countB.get(key) || 0) + 1);
        if (!sampleB.has(key)) sampleB.set(key, item);
    });

    const keys = new Set([...countA.keys(), ...countB.keys()]);
    const added = [];
    const removed = [];

    keys.forEach((key) => {
        const aCount = countA.get(key) || 0;
        const bCount = countB.get(key) || 0;

        if (bCount > aCount) {
            for (let i = 0; i < bCount - aCount; i += 1) {
                added.push(sampleB.get(key));
            }
        }

        if (aCount > bCount) {
            for (let i = 0; i < aCount - bCount; i += 1) {
                removed.push(sampleA.get(key));
            }
        }
    });

    return {
        totalA: listA.length,
        totalB: listB.length,
        added,
        removed
    };
}

function sigButton(x) {
    return [
        normalizeText(x?.text),
        normalizeText(x?.id),
        normalizeText(x?.className),
        normalizeText(x?.type)
    ].join("||");
}

function sigLink(x) {
    return [
        normalizeText(x?.text),
        normalizeText(x?.href)
    ].join("||");
}

function sigForm(x) {
    return [
        normalizeText(x?.action),
        normalizeText(x?.method),
        String(x?.inputCount ?? 0)
    ].join("||");
}

function sigTable(x) {
    return [
        String(x?.rows ?? 0),
        String(x?.columns ?? 0)
    ].join("||");
}

function sigSection(x) {
    return [
        normalizeText(x?.tag),
        normalizeText(x?.id),
        normalizeText(x?.heading)
    ].join("||");
}

function sigHeading(x) {
    return [
        normalizeText(x?.tag),
        normalizeText(x?.text)
    ].join("||");
}

function sigApi(x) {
    return [
        normalizeText(x?.name),
        normalizeText(x?.initiatorType)
    ].join("||");
}

export default function ComparePage({ goHome }) {
    const [history, setHistory] = useState([]);
    const [selectedUrl, setSelectedUrl] = useState("");
    const [versionAId, setVersionAId] = useState("");
    const [versionBId, setVersionBId] = useState("");
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const result = await window.electronAPI.getHistory();

        if (result.success) {
            console.log(result.rows);
            setHistory(result.rows);
        }
    };

    const groupedUrls = useMemo(() => {
        const map = new Map();

        history.forEach((item) => {
            if (!map.has(item.url)) {
                map.set(item.url, []);
            }
            map.get(item.url).push(item);
        });

        return Array.from(map.entries())
            .filter(([, items]) => items.length >= 2)
            .map(([url, items]) => ({
                url,
                items: items.sort((a, b) => b.id - a.id)
            }));
    }, [history]);

    useEffect(() => {
        if (!selectedUrl && groupedUrls.length > 0) {
            setSelectedUrl(groupedUrls[0].url);
        }
    }, [groupedUrls, selectedUrl]);

    const versionsForSelectedUrl = useMemo(() => {
        if (!selectedUrl) return [];
        return history
            .filter((item) => item.url === selectedUrl)
            .sort((a, b) => b.id - a.id);
    }, [history, selectedUrl]);

    useEffect(() => {
        if (versionsForSelectedUrl.length >= 2) {
            const first = String(versionsForSelectedUrl[0].id);
            const second = String(versionsForSelectedUrl[1].id);

            setVersionAId((prev) => (versionsForSelectedUrl.some((v) => String(v.id) === prev) ? prev : first));
            setVersionBId((prev) => (versionsForSelectedUrl.some((v) => String(v.id) === prev && prev !== versionAId) ? prev : second));
        }
    }, [versionsForSelectedUrl, versionAId]);

    const runComparison = async () => {
        if (!versionAId || !versionBId || versionAId === versionBId) return;

        setLoading(true);
        setComparison(null);

        try {
            const [resultA, resultB] = await Promise.all([
                window.electronAPI.getCaptureDetails(Number(versionAId)),
                window.electronAPI.getCaptureDetails(Number(versionBId))
            ]);

            if (!resultA.success || !resultB.success) {
                setLoading(false);
                return;
            }

            const a = resultA.data;
            const b = resultB.data;

            const structuredA = a.structured || {};
            const structuredB = b.structured || {};

            const rows = [
                {
                    metric: "Load Time (ms)",
                    a: a.load_time_ms || 0,
                    b: b.load_time_ms || 0
                },
                {
                    metric: "DOM Nodes",
                    a: a.dom_nodes || 0,
                    b: b.dom_nodes || 0
                },
                {
                    metric: "Buttons",
                    a: a.buttons_count || 0,
                    b: b.buttons_count || 0
                },
                {
                    metric: "Links",
                    a: a.links_count || 0,
                    b: b.links_count || 0
                },
                {
                    metric: "Forms",
                    a: a.forms_count || 0,
                    b: b.forms_count || 0
                },
                {
                    metric: "Tables",
                    a: a.tables_count || 0,
                    b: b.tables_count || 0
                },
                {
                    metric: "Sections",
                    a: a.sections_count || 0,
                    b: b.sections_count || 0
                },
                {
                    metric: "Headings",
                    a: a.headings_count || 0,
                    b: b.headings_count || 0
                },
                {
                    metric: "API Calls",
                    a: a.api_count || 0,
                    b: b.api_count || 0
                }
            ].map((row) => ({
                ...row,
                diff: row.b - row.a
            }));

            const diffs = {
                buttons: diffCollection(structuredA.buttons || [], structuredB.buttons || [], sigButton),
                links: diffCollection(structuredA.links || [], structuredB.links || [], sigLink),
                forms: diffCollection(structuredA.forms || [], structuredB.forms || [], sigForm),
                tables: diffCollection(structuredA.tables || [], structuredB.tables || [], sigTable),
                sections: diffCollection(structuredA.sections || [], structuredB.sections || [], sigSection),
                headings: diffCollection(structuredA.headings || [], structuredB.headings || [], sigHeading),
                apiCalls: diffCollection(structuredA.apiCalls || [], structuredB.apiCalls || [], sigApi)
            };

            setComparison({
                a,
                b,
                rows,
                diffs
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", height: "100%" }}>
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
                    <h2>Compare</h2>
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

                <div style={{ marginTop: "16px" }}>
                    {groupedUrls.map((group) => (
                        <div
                            key={group.url}
                            onClick={() => setSelectedUrl(group.url)}
                            style={{
                                padding: "12px",
                                marginTop: "10px",
                                background: selectedUrl === group.url ? "#334155" : "#1e293b",
                                borderRadius: "8px",
                                cursor: "pointer"
                            }}
                        >
                            <div style={{ fontWeight: "bold" }}>
                                {group.items[0]?.title || "Untitled"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                {group.url}
                            </div>
                            <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
                                Versions: {group.items.length}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                <h2>Version Comparison</h2>

                {!selectedUrl && (
                    <p>Select a URL with at least two saved versions.</p>
                )}

                {selectedUrl && (
                    <>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "12px",
                                marginTop: "16px"
                            }}
                        >
                            <div>
                                <label>Version A</label>
                                <select
                                    value={versionAId}
                                    onChange={(e) => setVersionAId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        marginTop: "6px"
                                    }}
                                >
                                    {versionsForSelectedUrl.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {

    new Date(
    item.captured_at
)
.toLocaleString(
    "en-IN",
    {
        dateStyle: "medium",
        timeStyle: "medium"
    }
)
}
{" — "}

{item.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Version B</label>
                                <select
                                    value={versionBId}
                                    onChange={(e) => setVersionBId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        marginTop: "6px"
                                    }}
                                >
                                    {versionsForSelectedUrl.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {

    new Date(
    item.captured_at
)

.toLocaleString(

    "en-IN",

    {

        dateStyle: "medium",

        timeStyle: "medium"
    }
)

}

{" — "}

{item.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={runComparison}
                            disabled={loading || !versionAId || !versionBId || versionAId === versionBId}
                            style={{
                                marginTop: "16px",
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: "8px",
                                background: "#2563eb",
                                color: "white",
                                cursor: "pointer"
                            }}
                        >
                            {loading ? "Comparing..." : "Compare"}
                        </button>

                        {comparison && (
                            <>
                                <div style={{ marginTop: "24px" }}>
                                    <h3>Summary Differences</h3>
                                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: "left", padding: "8px" }}>Metric</th>
                                                <th style={{ textAlign: "left", padding: "8px" }}>A</th>
                                                <th style={{ textAlign: "left", padding: "8px" }}>B</th>
                                                <th style={{ textAlign: "left", padding: "8px" }}>Diff</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comparison.rows.map((row) => (
                                                <tr key={row.metric}>
                                                    <td style={{ padding: "8px" }}>{row.metric}</td>
                                                    <td style={{ padding: "8px" }}>{row.a}</td>
                                                    <td style={{ padding: "8px" }}>{row.b}</td>
                                                    <td style={{ padding: "8px" }}>{row.diff}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {[
                                    ["Buttons", comparison.diffs.buttons],
                                    ["Links", comparison.diffs.links],
                                    ["Forms", comparison.diffs.forms],
                                    ["Tables", comparison.diffs.tables],
                                    ["Sections", comparison.diffs.sections],
                                    ["Headings", comparison.diffs.headings],
                                    ["API Calls", comparison.diffs.apiCalls]
                                ].map(([title, diff]) => (
                                    <div key={String(title)} style={{ marginTop: "24px" }}>
                                        <h3>{title}</h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                            <div>
                                                <strong>Added</strong>
                                                <pre style={{ whiteSpace: "pre-wrap" }}>
                                                    {JSON.stringify(diff.added.slice(0, 50), null, 2)}
                                                </pre>
                                            </div>
                                            <div>
                                                <strong>Removed</strong>
                                                <pre style={{ whiteSpace: "pre-wrap" }}>
                                                    {JSON.stringify(diff.removed.slice(0, 50), null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ marginTop: "24px" }}>
                                    <h3>Screenshots</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <strong>Version A</strong>
                                            <img
                                                src={toFileUrl(comparison.a.screenshot_path)}
                                                alt="Version A"
                                                style={{
                                                    width: "100%",
                                                    marginTop: "8px",
                                                    borderRadius: "10px"
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <strong>Version B</strong>
                                            <img
                                                src={toFileUrl(comparison.b.screenshot_path)}
                                                alt="Version B"
                                                style={{
                                                    width: "100%",
                                                    marginTop: "8px",
                                                    borderRadius: "10px"
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}