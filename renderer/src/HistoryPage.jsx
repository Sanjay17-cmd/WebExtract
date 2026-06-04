import {

    useEffect,
    useState

} from "react";

export default function HistoryPage() {

    // =====================================
    // STATES
    // =====================================

    const [history, setHistory] =
        useState([]);

    const [

        selectedCapture,

        setSelectedCapture

    ] = useState(null);

    // =====================================
    // LOAD HISTORY
    // =====================================

    useEffect(() => {

        loadHistory();

    }, []);

    // =====================================
    // GET HISTORY
    // =====================================

    const loadHistory = async () => {

        const result =
            await window
            .electronAPI
            .getHistory();

        if (

            result.success
        ) {

            setHistory(
                result.rows
            );
        }
    };

    // =====================================
    // LOAD DETAILS
    // =====================================

    const openCapture = async (

        id
    ) => {

        const result =
            await window
            .electronAPI
            .getCaptureDetails(
                id
            );

        if (

            result.success
        ) {

            setSelectedCapture(

                result.data
            );
        }
    };

    return (

        <div

            style={{

                display: "flex",

                height: "100%"
            }}
        >

            {/* ========================= */}
            {/* LEFT SIDE */}
            {/* ========================= */}

            <div

                style={{

                    width: "320px",

                    borderRight:
                        "1px solid #334155",

                    overflowY: "auto",

                    padding: "12px"
                }}
            >

                <h2>

                    History

                </h2>

                {

                    history.map((item) => (

                        <div

                            key={item.id}

                            onClick={() =>

                                openCapture(
                                    item.id
                                )
                            }

                            style={{

                                padding: "12px",

                                marginTop: "10px",

                                background:
                                    "#1e293b",

                                borderRadius:
                                    "8px",

                                cursor: "pointer"
                            }}
                        >

                            <div>

                                {item.title}

                            </div>

                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#94a3b8"
                                }}
                            >

                                {item.url}

                            </div>

                        </div>
                    ))
                }

            </div>

            {/* ========================= */}
            {/* RIGHT SIDE */}
            {/* ========================= */}

            <div

                style={{

                    flex: 1,

                    padding: "16px",

                    overflowY: "auto"
                }}
            >

                {

                    selectedCapture && (

                        <div>

                            <h2>

                                {

                                    selectedCapture
                                    .title
                                }

                            </h2>

                            {/* ============= */}
                            {/* SCREENSHOT */}
                            {/* ============= */}

                            <img

                                src={

                                    selectedCapture
                                    .screenshot_path
                                }

                                style={{

                                    width: "100%",

                                    borderRadius:
                                        "10px"
                                }}
                            />

                            {/* ============= */}
                            {/* METRICS */}
                            {/* ============= */}

                            <div

                                style={{

                                    display: "grid",

                                    gridTemplateColumns:
                                        "1fr 1fr 1fr",

                                    gap: "12px",

                                    marginTop: "20px"
                                }}
                            >

                                <div>

                                    Buttons:
                                    {" "}

                                    {

                                        selectedCapture
                                        .buttons
                                    }

                                </div>

                                <div>

                                    Links:
                                    {" "}

                                    {

                                        selectedCapture
                                        .links
                                    }

                                </div>

                                <div>

                                    Forms:
                                    {" "}

                                    {

                                        selectedCapture
                                        .forms
                                    }

                                </div>

                                <div>

                                    Tables:
                                    {" "}

                                    {

                                        selectedCapture
                                        .tables_count
                                    }

                                </div>

                                <div>

                                    Sections:
                                    {" "}

                                    {

                                        selectedCapture
                                        .sections
                                    }

                                </div>

                                <div>

                                    DOM Nodes:
                                    {" "}

                                    {

                                        selectedCapture
                                        .dom_nodes
                                    }

                                </div>

                            </div>

                        </div>
                    )
                }

            </div>

        </div>
    );
}