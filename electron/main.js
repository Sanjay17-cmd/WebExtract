const { app, BrowserWindow } = require("electron");

const {

    initDatabase

} = require(
    "../storage/postgres"
);
// Enable Chrome DevTools Protocol remote debugging for Playwright connectOverCDP
app.commandLine.appendSwitch("remote-debugging-port", "9222");

require("./crawlIpc");
require("./ipc");

let mainWindow;

function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1600,

        height: 1000,

        webPreferences: {

            nodeIntegration: false,

            contextIsolation: true,

            preload: require("path").join(
    __dirname,
    "preload.js"
),

            webviewTag: true,

            webSecurity: false
        }
    });

    mainWindow.loadURL(
        "http://localhost:5173"
    );
}

app.whenReady().then(async () => {

    await initDatabase();

    createWindow();

});