'use strict';

var _electron = require('electron');

var _electron2 = _interopRequireDefault(_electron);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//const electron = require('electron')
// Module to control application life.
var app = _electron2.default.app;
// Module to create native browser window.
var BrowserWindow = _electron2.default.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = void 0;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({ width: 1400, height: 800 });

	// and load the index.html of the app.
	mainWindow.loadURL(_url2.default.format({
		pathname: _path2.default.resolve(_path2.default.join(__dirname, '../index.html')),
		protocol: 'file:',
		slashes: true
	}));

	mainWindow.homeDirectory = app.getPath('home');

	mainWindow.setPosition(0, 0);

	// Open the DevTools.
	mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});
//# sourceMappingURL=electron.js.map
