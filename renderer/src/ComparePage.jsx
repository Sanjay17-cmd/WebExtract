import { useEffect, useMemo, useState } from "react";
import HtmlDiffViewer from "./HtmlDiffViewer";
import { prettyDate, toFileUrl } from "./formatters";

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
    const [selectedVersionAId, setSelectedVersionAId] = useState("");
    const [selectedVersionBId, setSelectedVersionBId] = useState("");
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [visualDiff, setVisualDiff] = useState(null);

    useEffect(() => {
        let active = true;
        window.electronAPI.getHistory().then((result) => {
            if (active && result.success) {
                setHistory(result.rows);
            }
        });

        return () => {
            active = false;
        };
    }, []);

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

    const activeUrl = groupedUrls.some((group) => group.url === selectedUrl)
        ? selectedUrl
        : groupedUrls[0]?.url || "";

    const versionsForSelectedUrl = useMemo(() => {
        if (!activeUrl) return [];
        return history
            .filter((item) => item.url === activeUrl)
            .sort((a, b) => b.id - a.id);
    }, [history, activeUrl]);

    const versionAId = versionsForSelectedUrl.some(
        (item) => String(item.id) === selectedVersionAId
    )
        ? selectedVersionAId
        : String(versionsForSelectedUrl[0]?.id ?? "");
    const versionBId = versionsForSelectedUrl.some(
        (item) => String(item.id) === selectedVersionBId && selectedVersionBId !== versionAId
    )
        ? selectedVersionBId
        : String(versionsForSelectedUrl.find((item) => String(item.id) !== versionAId)?.id ?? "");

    const runComparison = async () => {
    if (!versionAId || !versionBId || versionAId === versionBId) return;

    setLoading(true);
    setComparison(null);
    setVisualDiff(null);

    try {
        const [resultA, resultB] = await Promise.all([
            window.electronAPI.getCaptureDetails(Number(versionAId)),
            window.electronAPI.getCaptureDetails(Number(versionBId))
        ]);

        if (!resultA.success || !resultB.success) {
            return;
        }

        const a = resultA.data;
        const b = resultB.data;

        const structuredA = a.structured || {};
        const structuredB = b.structured || {};

        const rows = [
            { metric: "Load Time (ms)", a: a.load_time_ms || 0, b: b.load_time_ms || 0 },
            { metric: "DOM Nodes", a: a.dom_nodes || 0, b: b.dom_nodes || 0 },
            { metric: "Buttons", a: a.buttons_count || 0, b: b.buttons_count || 0 },
            { metric: "Links", a: a.links_count || 0, b: b.links_count || 0 },
            { metric: "Forms", a: a.forms_count || 0, b: b.forms_count || 0 },
            { metric: "Tables", a: a.tables_count || 0, b: b.tables_count || 0 },
            { metric: "Sections", a: a.sections_count || 0, b: b.sections_count || 0 },
            { metric: "Headings", a: a.headings_count || 0, b: b.headings_count || 0 },
            { metric: "API Calls", a: a.api_count || 0, b: b.api_count || 0 }
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

        const visualResult = await window.electronAPI.generateVisualDiff(
            Number(versionAId),
            Number(versionBId)
        );

        if (visualResult.success) {
            setVisualDiff(visualResult);
        }
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
                    <button onClick={goHome}>Home</button>
                </div>

                <div style={{ marginTop: "12px", color: "#94a3b8", fontSize: "13px" }}>
                    Only URLs with at least two saved versions are shown.
                </div>

                <div style={{ marginTop: "16px" }}>
                    {groupedUrls.map((group) => (
                        <div
                            key={group.url}
                            onClick={() => setSelectedUrl(group.url)}
                            style={{
                                padding: "12px",
                                marginTop: "10px",
                                background: activeUrl === group.url ? "#334155" : "#1e293b",
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

                {!activeUrl && (
                    <p>Select a URL with at least two saved versions.</p>
                )}

                {activeUrl && (
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
                                    onChange={(e) => setSelectedVersionAId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        marginTop: "6px"
                                    }}
                                >
                                    {versionsForSelectedUrl.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {prettyDate(item.captured_at)} — {item.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Version B</label>
                                <select
                                    value={versionBId}
                                    onChange={(e) => setSelectedVersionBId(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        marginTop: "6px"
                                    }}
                                >
                                    {versionsForSelectedUrl.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {prettyDate(item.captured_at)} — {item.title}
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
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, 1fr)",
                                            gap: "12px"
                                        }}
                                    >
                                        {comparison.rows.map((row) => (
                                            <div key={row.metric} className="metric-card">
                                                <div style={{ fontWeight: "bold" }}>{row.metric}</div>
                                                <div>A: {row.a}</div>
                                                <div>B: {row.b}</div>
                                                <div>Diff: {row.diff}</div>
                                            </div>
                                        ))}
                                    </div>
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

                                {

visualDiff && (

<div

    style={{

        marginTop:
            "30px"
    }}
>

    <h3>

        Visual Diff

    </h3>

    <div>

        Changed Pixels:

        {" "}

        {

            visualDiff
            .changedPixels

        }

    </div>

    <img
        src={
            toFileUrl(
                visualDiff.diffPath
            )
        }
        style={{
            width:"100%", marginTop:"10px", borderRadius:"10px"
        }}
        alt="Visual Diff"
    />
</div>)}
                                <div
    style={{
        marginTop:
            "30px"
    }}
>
    <h3>     HTML Source Diff    </h3>
    <HtmlDiffViewer
        oldHtml={
            comparison.a.html
        }
        newHtml={
            comparison.b.html
        }
    />
</div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}