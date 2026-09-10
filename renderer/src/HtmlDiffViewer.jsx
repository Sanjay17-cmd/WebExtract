import { useEffect, useRef } from "react";

import * as monaco from "monaco-editor";

export default function HtmlDiffViewer({

    oldHtml,

    newHtml

}) {

    const containerRef =
        useRef(null);

    const editorRef =
        useRef(null);

    useEffect(() => {

        if (

            !containerRef.current

        ) return;

        const originalModel =
            monaco.editor.createModel(

                oldHtml || "",

                "html"
            );

        const modifiedModel =
            monaco.editor.createModel(

                newHtml || "",

                "html"
            );

        editorRef.current =
            monaco.editor.createDiffEditor(

                containerRef.current,

                {

                    theme:
                        "vs-dark",

                    automaticLayout:
                        true,

                    readOnly:
                        true,

                    renderSideBySide:
                        true
                }
            );

        editorRef.current.setModel({

            original:
                originalModel,

            modified:
                modifiedModel
        });

        return () => {

            originalModel.dispose();

            modifiedModel.dispose();

            editorRef.current?.dispose();
        };

    }, [

        oldHtml,

        newHtml
    ]);

    return (

        <div

            ref={containerRef}

            style={{

                width: "100%",

                height: "700px",

                border:
                    "1px solid #334155",

                borderRadius:
                    "10px",

                overflow:
                    "hidden"
            }}
        />
    );
}