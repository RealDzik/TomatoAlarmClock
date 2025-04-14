import React, { useEffect, useState, useCallback } from 'react';
import { ipcRenderer } from 'electron';
import { TimerSettings, TimerState, TimerPhase, DailyStats, WorkBlock } from '../../shared/types';
import { formatTime, getPhaseLabel, calculateProgress, getCurrentDateString } from '../../shared/utils';
import { Timer } from '../timer';
import WorkBlockList from './WorkBlockList';
import './MainTimer.css';

interface MainTimerProps {
    settings: TimerSettings;
}

const DEFAULT_WORK_DURATION = 25;

const MainTimer: React.FC<MainTimerProps> = ({ settings }) => {
    const [timerState, setTimerState] = useState<TimerState>(() => {
        const workDuration = settings?.workDuration || DEFAULT_WORK_DURATION;
        console.log('Initializing timer state with work duration:', workDuration);
        return {
            phase: TimerPhase.WORK,
            timeRemaining: workDuration * 60,
            isRunning: false,
            completedPomodoros: 0,
            activeWorkBlock: null
        };
    });

    const { phase, timeRemaining, isRunning, completedPomodoros, activeWorkBlock } = timerState;

    const [timer] = useState(() => {
        const defaultSettings: TimerSettings = {
            workDuration: DEFAULT_WORK_DURATION,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            longBreakInterval: 4,
            autoStartBreak: false,
            autoStartWork: false,
            soundEnabled: true,
            notificationEnabled: true,
            autoStartWithSystem: false
        };
        const mergedSettings = settings ? { ...defaultSettings, ...settings } : defaultSettings;
        console.log('Creating timer with settings:', mergedSettings);
        return new Timer(mergedSettings, setTimerState);
    });

    // State for daily work blocks
    const [dailyWorkBlocks, setDailyWorkBlocks] = useState<WorkBlock[]>([]);
    const [currentDate, setCurrentDate] = useState<string>(getCurrentDateString());

    // Fetch initial stats and listen for updates
    useEffect(() => {
        const fetchStats = async () => {
            const today = getCurrentDateString();
            setCurrentDate(today);
            try {
                const stats: DailyStats = await ipcRenderer.invoke('get-daily-stats', today);
                setDailyWorkBlocks((stats.workBlocks || []).filter(b => b.id !== activeWorkBlock?.id));
                timer.setCompletedPomodoros(stats.completedPomodoros || 0);
            } catch (error) {
                console.error('Failed to get daily stats:', error);
                setDailyWorkBlocks([]);
            }
        };

        fetchStats();

        const handleStatsUpdate = (event: Electron.IpcRendererEvent, updatedStats: DailyStats | null) => {
            const today = getCurrentDateString();
             if (updatedStats && updatedStats.date === today) {
                setDailyWorkBlocks((updatedStats.workBlocks || []).filter(b => b.id !== activeWorkBlock?.id));
             } else if (updatedStats === null) {
                 setDailyWorkBlocks([]);
                 timer.setCompletedPomodoros(0);
                 setCurrentDate(today);
             } else if (updatedStats && updatedStats.date !== today) {
                 fetchStats();
             }
        };
        ipcRenderer.on('stats-updated', handleStatsUpdate);

        if (!activeWorkBlock) {
             fetchStats();
        }

        return () => {
            ipcRenderer.removeListener('stats-updated', handleStatsUpdate);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timer, activeWorkBlock]);

    useEffect(() => {
        if (settings) {
            console.log('Updating timer settings:', settings);
            timer.updateSettings(settings);
        }
    }, [settings, timer]);

    const handleToggleTimer = useCallback(() => {
        console.log('Toggle timer clicked, current state:', timerState.isRunning);
        if (timerState.isRunning) {
            timer.pause();
        } else {
            timer.start();
        }
    }, [timer, timerState.isRunning]);

    useEffect(() => {
        ipcRenderer.on('toggle-timer', handleToggleTimer);
        ipcRenderer.on('skip-phase', () => timer.skipPhase());

        return () => {
            ipcRenderer.removeListener('toggle-timer', handleToggleTimer);
            ipcRenderer.removeListener('skip-phase', () => timer.skipPhase());
        };
    }, [timer, handleToggleTimer]);

    // Function to handle saving updated work block text
    const handleUpdateWorkBlockText = async (updatedBlock: WorkBlock) => {
        if (activeWorkBlock && updatedBlock.id === activeWorkBlock.id) {
            const newActiveBlock = { ...activeWorkBlock, text: updatedBlock.text };
            timer.setActiveWorkBlockText(newActiveBlock.text);
            setTimerState(prevState => ({ ...prevState, activeWorkBlock: newActiveBlock }));
        }
        try {
            const success = await ipcRenderer.invoke('update-work-block', currentDate, updatedBlock);
            if (!success) {
                console.error('Failed to update work block on main process.');
            }
        } catch (error) {
            console.error('Error invoking update-work-block:', error);
        }
    };

    const progress = calculateProgress(
        timeRemaining,
        timer.getDurationForPhase(phase)
    );

    return (
        <div className="main-timer-layout">
            <div className="timer-panel-left">
                <div className="phase-indicator">
                    {getPhaseLabel(phase)}
                </div>
                <div className="timer-display">
                    {formatTime(timeRemaining)}
                </div>
                <div className="progress-bar">
                    <div 
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="pomodoro-count">
                    今日完成：{completedPomodoros} 个番茄钟
                </div>
                <div className="controls">
                    <button onClick={handleToggleTimer}>
                        {isRunning ? '暂停' : '开始'}
                    </button>
                    <button onClick={() => timer.skipPhase()}>
                        跳过
                    </button>
                    <button onClick={() => timer.reset()}>
                        重置
                    </button>
                </div>
                <div className="shortcuts-info">
                    <div className="shortcut-item">
                        <span className="shortcut-key">Ctrl + Alt + Z</span>
                        <span className="shortcut-desc">开始/暂停</span>
                    </div>
                    <div className="shortcut-item">
                        <span className="shortcut-key">Ctrl + Alt + A</span>
                        <span className="shortcut-desc">跳过当前阶段</span>
                    </div>
                </div>
            </div>

            <div className="work-block-panel-right">
                <h3>今日工作记录 ({currentDate})</h3>
                <WorkBlockList
                    activeWorkBlock={activeWorkBlock}
                    workBlocks={dailyWorkBlocks}
                    onUpdateBlock={handleUpdateWorkBlockText}
                />
            </div>
        </div>
    );
};

export default MainTimer; 