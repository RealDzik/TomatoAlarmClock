import { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import sharp from 'sharp';
import { getSettings, saveSettings, getDailyStats, addDailyStats, clearStats } from './store';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// 更新开机启动状态
function updateAutoStartWithSystem(enable: boolean) {
    if (!app.isPackaged) {
        console.log('开发模式下不设置开机启动');
        return;
    }
    
    app.setLoginItemSettings({
        openAtLogin: enable,
        path: process.execPath,
        args: ['--hidden']  // 开机启动时隐藏窗口
    });
}

async function createTrayIconWithText(text: string, isRunning: boolean): Promise<Buffer> {
    const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'assets', 'tray-icon.png')
        : path.join(__dirname, '..', 'assets', 'tray-icon.png');

    console.log('Tray icon path:', iconPath);
    console.log('Is packaged:', app.isPackaged);
    console.log('Resources path:', process.resourcesPath);
    console.log('__dirname:', __dirname);
    console.log('Current working directory:', process.cwd());

    try {
        // 检查文件是否存在
        const fs = require('fs');
        const exists = fs.existsSync(iconPath);
        console.log('Icon file exists:', exists);
        if (!exists) {
            throw new Error(`Icon file not found at ${iconPath}`);
        }

        // 使用sharp处理图片
        const image = sharp(iconPath);
        const metadata = await image.metadata();
        console.log('Image metadata:', metadata);
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
    } catch (error) {
        console.error('Error creating tray icon:', error);
        throw error;
    }
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
        
    console.log('Creating tray with icon path:', iconPath);
    
    try {
        const icon = nativeImage.createFromPath(iconPath);
        
        // 如果图标加载失败，尝试使用较小的图标
        if (icon.isEmpty()) {
            console.error('Failed to load tray icon, falling back to 16x16 icon');
            const smallIconPath = app.isPackaged
                ? path.join(process.resourcesPath, 'assets', 'icon-16.png')
                : path.join(__dirname, '..', 'assets', 'icon-16.png');
            console.log('Trying fallback icon path:', smallIconPath);
            tray = new Tray(smallIconPath);
        } else {
            tray = new Tray(icon);
        }
    } catch (error) {
        console.error('Error creating tray:', error);
        // 如果所有图标都加载失败，使用默认图标
        tray = new Tray(nativeImage.createEmpty());
    }

    const contextMenu = Menu.buildFromTemplate([
        { 
            label: '显示/隐藏窗口',
            click: () => {
                if (!mainWindow) {
                    // 如果窗口在静默启动时未创建或意外关闭，则重新创建
                    createWindow(false); // 创建并显示
                } else {
                    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
                }
            }
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
                if (!mainWindow) createWindow(false); // 确保窗口存在
                mainWindow?.show();
                mainWindow?.webContents.send('show-settings');
            }
        },
        { 
            label: '统计',
            click: () => {
                if (!mainWindow) createWindow(false); // 确保窗口存在
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

    // 左键单击显示/隐藏窗口 (也处理窗口不存在的情况)
    tray.on('click', () => {
        if (!mainWindow) {
            createWindow(false); // 创建并显示
        } else {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
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

function createWindow(startHidden: boolean = false) {
  // 防止重复创建
  if (mainWindow) {
    if (!startHidden) mainWindow.show(); // 如果要求显示，则显示现有窗口
    return;
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    resizable: true,
    minWidth: 600,
    minHeight: 500,
    show: !startHidden, // 根据参数决定是否显示
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  if (process.env.NODE_ENV === 'development' && !startHidden) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null; // 窗口关闭时，将 mainWindow 设置为 null
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
    // 确保窗口存在再操作
    if (!mainWindow) {
        createWindow(false); // 创建并显示
    } else {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  // 检查是否是静默启动
  const shouldStartHidden = process.argv.includes('--hidden');

  createWindow(shouldStartHidden); // 根据参数创建窗口
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(false); // 如果没有窗口，则创建并显示
    } else {
        // 如果有窗口但不可见，则显示它
        mainWindow?.show();
    }
  });

  // 监听开机启动设置变化
  ipcMain.handle('set-auto-start', (event, enable: boolean) => {
    const currentSettings = getSettings(); // 获取当前设置
    const newSettings = { ...currentSettings, autoStartWithSystem: enable }; // 更新设置
    updateAutoStartWithSystem(enable);
    saveSettings(newSettings); // 保存完整设置对象
    return true; // 返回确认
  });

  // 提供获取当前设置的接口
  ipcMain.handle('get-settings', () => {
    return getSettings();
  });

  // 提供保存设置的接口 (可以合并到 set-auto-start 或单独保留)
  ipcMain.handle('save-settings', (event, settings) => {
    // 检查是否包含 autoStartWithSystem 设置，并相应地更新系统设置
    if (settings.hasOwnProperty('autoStartWithSystem')) {
        updateAutoStartWithSystem(settings.autoStartWithSystem); // 修正属性名
    }
    saveSettings(settings);
    return true;
  });

  // 处理统计数据相关 IPC
  ipcMain.handle('get-daily-stats', (event, date: string) => {
    // 根据 store.ts，getDailyStats 返回整个数组，需要查找特定日期
    const allStats = getDailyStats();
    return allStats.find(s => s.date === date) || { date, completedPomodoros: 0, totalWorkTime: 0, totalBreakTime: 0 };
  });

  ipcMain.handle('add-daily-stats', (event, date: string, type: 'pomodoro' | 'workTime', value: number) => {
    const allStats = getDailyStats();
    let todayStats = allStats.find(s => s.date === date);

    // 如果当天没有统计数据，创建一个新的
    if (!todayStats) {
        todayStats = { date, completedPomodoros: 0, totalWorkTime: 0, totalBreakTime: 0 };
    }

    // 更新对应的统计值
    if (type === 'pomodoro') {
        todayStats.completedPomodoros += value; // 假设 value 是增量
    } else if (type === 'workTime') {
        todayStats.totalWorkTime += value; // 假设 value 是增量 (分钟？)
    }
    
    // 调用 store 中的函数保存/更新
    addDailyStats(todayStats); 
    return true;
  });

  ipcMain.handle('clear-stats', () => {
      clearStats();
      return true;
  });

});

app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    // app.quit(); // 不退出，保持托盘图标运行
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  // 注销所有快捷键
  globalShortcut.unregisterAll();
  // 销毁托盘图标
  if (tray) {
    tray.destroy();
  }
});

// 确保只有一个实例运行
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时,聚焦于主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show(); // 确保窗口可见
    } else {
        // 如果第一个实例是静默启动的，第二个实例启动时创建并显示窗口
        createWindow(false);
    }
  });
}