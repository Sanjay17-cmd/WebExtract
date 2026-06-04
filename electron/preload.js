const {

    contextBridge,

    ipcRenderer

} = require("electron");


// ========================================
// SAFE IPC API
// ========================================

contextBridge.exposeInMainWorld(

    "electronAPI",

    {

        saveCapture:

            (data) =>

                ipcRenderer.invoke(

                    "save-capture",

                    data
                ),

        getHistory:

            () =>

                ipcRenderer.invoke(

                    "get-history"
                ),

        getCaptureDetails:

            (id) =>

                ipcRenderer.invoke(

                    "get-capture-details",

                    id
                )
    }
);