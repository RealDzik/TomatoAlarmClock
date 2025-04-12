import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import MainTimer from './MainTimer';
import Settings from './Settings';
import Statistics from './Statistics';
import { TimerSettings } from '../../shared/types';

const DEFAULT_SETTINGS: TimerSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 30,
    longBreakInterval: 4,
    autoStartBreak: true,
    autoStartWork: true,
    soundEnabled: true,
    notificationEnabled: true
};

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState('timer');
    const [settings, setSettings] = useState<TimerSettings>(() => {
        try {
            const data = ipcRenderer.sendSync('electron-store-get-data');
            return data.settings || DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return DEFAULT_SETTINGS;
        }
    });

    useEffect(() => {
        const handleShowSettings = () => setCurrentView('settings');
        const handleShowStatistics = () => setCurrentView('statistics');

        ipcRenderer.on('show-settings', handleShowSettings);
        ipcRenderer.on('show-statistics', handleShowStatistics);

        return () => {
            ipcRenderer.removeListener('show-settings', handleShowSettings);
            ipcRenderer.removeListener('show-statistics', handleShowStatistics);
        };
    }, []);

    const handleSettingsChange = (newSettings: TimerSettings) => {
        setSettings(newSettings);
        ipcRenderer.send('electron-store-save-settings', newSettings);
    };

    const renderView = () => {
        switch (currentView) {
            case 'timer':
                return <MainTimer settings={settings} />;
            case 'settings':
                return <Settings settings={settings} onSettingsChange={handleSettingsChange} />;
            case 'statistics':
                return <Statistics />;
            default:
                return null;
        }
    };

    return (
        <div className="app">
            <div className="title-bar">
                <div className="title">番茄闹钟</div>
                <div className="window-controls">
                    <button className="window-control" onClick={() => window.close()}>✕</button>
                </div>
            </div>
            <div className="content">
                {renderView()}
            </div>
            <div className="navigation">
                <button 
                    className={currentView === 'timer' ? 'active' : ''} 
                    onClick={() => setCurrentView('timer')}
                >
                    计时器
                </button>
                <button 
                    className={currentView === 'settings' ? 'active' : ''} 
                    onClick={() => setCurrentView('settings')}
                >
                    设置
                </button>
                <button 
                    className={currentView === 'statistics' ? 'active' : ''} 
                    onClick={() => setCurrentView('statistics')}
                >
                    统计
                </button>
            </div>
        </div>
    );
};

export default App; 