"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const store_1 = require("./store");
let mainWindow = null;
let tray = null;
let isQuitting = false;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 300,
        height: 400,
        frame: false,
        resizable: false,
        icon: path.join(__dirname, '../assets/icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow?.hide();
    });
    // 允许拖动标题栏
    mainWindow.on('will-move', (event) => {
        // 允许窗口移动
    });
}
function createTray() {
    const icon = electron_1.nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'));
    tray = new electron_1.Tray(icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: '显示/隐藏',
            click: () => mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show()
        },
        { type: 'separator' },
        {
            label: '开始/暂停',
            click: () => mainWindow?.webContents.send('toggle-timer')
        },
        {
            label: '跳过',
            click: () => mainWindow?.webContents.send('skip-phase')
        },
        { type: 'separator' },
        {
            label: '设置',
            click: () => {
                mainWindow?.show();
                mainWindow?.webContents.send('show-settings');
            }
        },
        {
            label: '统计',
            click: () => {
                mainWindow?.show();
                mainWindow?.webContents.send('show-statistics');
            }
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                isQuitting = true;
                electron_1.app.quit();
            }
        }
    ]);
    tray.setToolTip('番茄闹钟');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
    });
    tray.on('right-click', () => {
        tray?.popUpContextMenu();
    });
}
function registerShortcuts() {
    // 注册全局快捷键
    electron_1.globalShortcut.register('CommandOrControl+Alt+Z', () => {
        mainWindow?.webContents.send('toggle-timer');
    });
    electron_1.globalShortcut.register('CommandOrControl+Alt+A', () => {
        mainWindow?.webContents.send('skip-phase');
    });
    electron_1.globalShortcut.register('CommandOrControl+Alt+X', () => {
        mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    registerShortcuts();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    isQuitting = true;
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
// 设置IPC通信
electron_1.ipcMain.on('electron-store-get-data', (event) => {
    event.returnValue = {
        settings: (0, store_1.getSettings)(),
        stats: (0, store_1.getDailyStats)()
    };
});
electron_1.ipcMain.on('electron-store-save-settings', (event, settings) => {
    (0, store_1.saveSettings)(settings);
    event.reply('electron-store-settings-saved');
});
electron_1.ipcMain.on('electron-store-add-stats', (event, stats) => {
    (0, store_1.addDailyStats)(stats);
    event.reply('electron-store-stats-added');
});
electron_1.ipcMain.on('electron-store-clear-stats', (event) => {
    (0, store_1.clearStats)();
    event.reply('electron-store-stats-cleared');
});
//# sourceMappingURL=main.js.map