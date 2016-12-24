"use strict";
const electron = require('electron');
const path = require('path');
const url = require('url');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({ width: 1400, height: 800 });
    mainWindow.loadURL(url.format({
        pathname: path.resolve(path.join(__dirname, '../index.html')),
        protocol: 'file:',
        slashes: true
    }));
    mainWindow.homeDirectory = app.getPath('home');
    mainWindow.setPosition(0, 0);
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}
app.on('ready', createWindow);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
//# sourceMappingURL=electron.js.map