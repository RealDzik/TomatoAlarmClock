"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    hideWindow: () => electron_1.ipcRenderer.send('hide-window'),
    getStoreData: () => electron_1.ipcRenderer.sendSync('electron-store-get-data'),
    saveSettings: (settings) => {
        electron_1.ipcRenderer.send('electron-store-save-settings', settings);
        return new Promise((resolve) => {
            electron_1.ipcRenderer.once('electron-store-settings-saved', () => resolve(true));
        });
    },
    addStats: (stats) => {
        electron_1.ipcRenderer.send('electron-store-add-stats', stats);
        return new Promise((resolve) => {
            electron_1.ipcRenderer.once('electron-store-stats-added', () => resolve(true));
        });
    },
    clearStats: () => {
        electron_1.ipcRenderer.send('electron-store-clear-stats');
        return new Promise((resolve) => {
            electron_1.ipcRenderer.once('electron-store-stats-cleared', () => resolve(true));
        });
    },
    onToggleTimer: (callback) => electron_1.ipcRenderer.on('toggle-timer', callback),
    onSkipPhase: (callback) => electron_1.ipcRenderer.on('skip-phase', callback),
    onShowSettings: (callback) => electron_1.ipcRenderer.on('show-settings', callback),
    onShowStatistics: (callback) => electron_1.ipcRenderer.on('show-statistics', callback)
});
//# sourceMappingURL=preload.js.map