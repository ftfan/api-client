'use strict';

import { app, protocol, BrowserWindow, ipcMain, powerSaveBlocker } from 'electron';
import { autoUpdater } from 'electron-updater';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
import { MyConfig } from './config';
import { MyEventsInstall } from './background/MyEvents';
import lodash from 'lodash';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow(lodash.merge({}, MyConfig.BrowserWindowOption));

  // console.log(process.env.WEBPACK_DEV_SERVER_URL, process.env);
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
    autoUpdater.checkForUpdatesAndNotify();
  }

  let id = powerSaveBlocker.start('prevent-app-suspension');

  // 每分钟检查系统是否会睡眠
  setInterval(() => {
    if (!powerSaveBlocker.isStarted(id)) {
      id = powerSaveBlocker.start('prevent-app-suspension');
    }
  }, 6000);

  win.on('closed', () => {
    powerSaveBlocker.stop(id);
    win = null;
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools();
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  registerLocalResourceProtocol();
  createWindow();
});

MyEventsInstall();

// 关闭窗口
ipcMain.on('main-win-close', () => {
  if (!win) return;
  win.close();
  app.quit();
});

// 显示主窗口
ipcMain.on('main-win-show', () => {
  if (!win) return;
  win.show();
});

ipcMain.on('main-win-size', (hevent, width: number, height: number, animate: boolean) => {
  if (!win) return;
  win.setContentSize(width, height, animate);
});

// 最小化窗口
ipcMain.on('main-win-minimize', () => {
  if (!win) return;
  win.minimize();
});

//最大化窗口
ipcMain.on('main-win-maximize', () => {
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

function registerLocalResourceProtocol() {
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const url = request.url.replace(/^local-resource:\/\//, '');
    // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
    const decodedUrl = decodeURI(url); // Needed in case URL contains spaces
    try {
      return callback(decodedUrl);
    } catch (error) {
      console.error('ERROR: registerLocalResourceProtocol: Could not get file path:', error);
    }
  });
}
// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
