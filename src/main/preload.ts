import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  hideWindow: () => ipcRenderer.send('hide-window'),
  getStoreData: () => ipcRenderer.sendSync('electron-store-get-data'),
  saveSettings: (settings: any) => {
    ipcRenderer.send('electron-store-save-settings', settings);
    return new Promise((resolve) => {
      ipcRenderer.once('electron-store-settings-saved', () => resolve(true));
    });
  },
  addStats: (stats: any) => {
    ipcRenderer.send('electron-store-add-stats', stats);
    return new Promise((resolve) => {
      ipcRenderer.once('electron-store-stats-added', () => resolve(true));
    });
  },
  clearStats: () => {
    ipcRenderer.send('electron-store-clear-stats');
    return new Promise((resolve) => {
      ipcRenderer.once('electron-store-stats-cleared', () => resolve(true));
    });
  },
  onToggleTimer: (callback: () => void) => ipcRenderer.on('toggle-timer', callback),
  onSkipPhase: (callback: () => void) => ipcRenderer.on('skip-phase', callback),
  onShowSettings: (callback: () => void) => ipcRenderer.on('show-settings', callback),
  onShowStatistics: (callback: () => void) => ipcRenderer.on('show-statistics', callback),
  updateTrayTime: (timeRemaining: number) => ipcRenderer.send('update-tray-time', timeRemaining)
}); 