import { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import sharp from 'sharp';
import { getSettings, saveSettings, getDailyStats, addDailyStats, clearStats } from './store';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

async function createTrayIconWithText(text: string, isRunning: boolean): Promise<Buffer> {
    const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'assets', 'tray-icon.png')
        : path.join(__dirname, '..', 'assets', 'tray-icon.png');

    // 使用sharp处理图片
    const image = sharp(iconPath);
    const metadata = await image.metadata();
    const width = metadata.width || 32;
    const height = metadata.height || 32;

    // 创建SVG文本
    const svgText = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="black" flood-opacity="0.8"/>
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="transparent"/>
            <text 
                x="50%" 
                y="52%" 
                font-family="Arial Black" 
                font-size="24" 
                fill="${isRunning ? 'white' : 'black'}" 
                text-anchor="middle" 
                dominant-baseline="middle"
                font-weight="900"
                filter="url(#shadow)"
            >${text}</text>
        </svg>
    `;

    // 将SVG转换为Buffer
    const svgBuffer = Buffer.from(svgText);
    
    // 合并原始图标和文字
    return await image
        .composite([{
            input: svgBuffer,
            blend: 'over'
        }])
        .toBuffer();
}

async function updateTrayIcon(minutes: number, isRunning: boolean): Promise<void> {
    if (!tray) return;
    
    try {
        const text = `${minutes}`;
        const buffer = await createTrayIconWithText(text, isRunning);
        const icon = nativeImage.createFromBuffer(buffer);
        tray.setImage(icon);
    } catch (error) {
        console.error('Failed to update tray icon:', error);
    }
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

    // 监听剩余时间更新
    ipcMain.on('update-tray-time', async (event, { timeRemaining, isRunning }: { timeRemaining: number, isRunning: boolean }) => {
        const minutes = Math.ceil(timeRemaining / 60);
        console.log('Updating tray time:', minutes, 'isRunning:', isRunning);
        await updateTrayIcon(minutes, isRunning);
    });

    // 初始化图标
    updateTrayIcon(25, false);
}

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