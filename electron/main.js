const { app, BrowserWindow } = require("electron");

let mainWindow;

function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1600,

        height: 1000,

        webPreferences: {

            nodeIntegration: true,

            contextIsolation: false,

            webviewTag: true
        }
    });

    mainWindow.loadURL(
        "http://localhost:5173"
    );
}

app.whenReady().then(() => {

    createWindow();

});