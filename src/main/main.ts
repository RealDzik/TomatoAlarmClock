import { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import { getSettings, saveSettings, getDailyStats, addDailyStats, clearStats } from './store';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    resizable: true,
    minWidth: 600,
    minHeight: 500,
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

  mainWindow.on('minimize', (event: Event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  // 允许拖动标题栏
  mainWindow.on('will-move', (event: Event) => {
    // 允许窗口移动
  });
}

function createTray() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'tray-icon.png')
    : path.join(__dirname, '..', 'assets', 'tray-icon.png');
    
  const icon = nativeImage.createFromPath(iconPath);
  
  // 如果图标加载失败，尝试使用较小的图标
  if (icon.isEmpty()) {
    console.error('Failed to load tray icon, falling back to 16x16 icon');
    const smallIconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'assets', 'icon-16.png')
      : path.join(__dirname, '..', 'assets', 'icon-16.png');
    tray = new Tray(smallIconPath);
  } else {
    tray = new Tray(icon);
  }

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '显示/隐藏窗口',
      click: () => mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show()
    },
    { type: 'separator' },
    { 
      label: '开始/暂停 (Ctrl+Alt+Z)',
      click: () => mainWindow?.webContents.send('toggle-timer')
    },
    { 
      label: '跳过当前阶段 (Ctrl+Alt+A)',
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
      label: '退出程序',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('番茄闹钟 - 右键点击显示菜单');
  tray.setContextMenu(contextMenu);

  // 左键单击显示/隐藏窗口
  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
  });
}

function registerShortcuts() {
  // 注册全局快捷键
  globalShortcut.register('CommandOrControl+Alt+Z', () => {
    mainWindow?.webContents.send('toggle-timer');
  });

  globalShortcut.register('CommandOrControl+Alt+A', () => {
    mainWindow?.webContents.send('skip-phase');
  });

  globalShortcut.register('CommandOrControl+Alt+X', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 设置IPC通信
ipcMain.on('electron-store-get-data', (event) => {
  event.returnValue = {
    settings: getSettings(),
    stats: getDailyStats()
  };
});

ipcMain.on('electron-store-save-settings', (event, settings) => {
  saveSettings(settings);
  event.reply('electron-store-settings-saved');
});

ipcMain.on('electron-store-add-stats', (event, stats) => {
  addDailyStats(stats);
  event.reply('electron-store-stats-added');
});

ipcMain.on('electron-store-clear-stats', (event) => {
  clearStats();
  event.reply('electron-store-stats-cleared');
});