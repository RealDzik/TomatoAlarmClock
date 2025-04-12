import React, { useEffect, useState, useCallback } from 'react';
import { ipcRenderer } from 'electron';
import { TimerSettings, TimerState, TimerPhase } from '../../shared/types';
import { formatTime, getPhaseLabel, calculateProgress } from '../../shared/utils';
import { Timer } from '../timer';

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
            completedPomodoros: 0
        };
    });

    const [timer] = useState(() => {
        const defaultSettings: TimerSettings = {
            workDuration: DEFAULT_WORK_DURATION,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            longBreakInterval: 4,
            autoStartBreak: false,
            autoStartWork: false,
            soundEnabled: true,
            notificationEnabled: true
        };
        const mergedSettings = settings ? { ...defaultSettings, ...settings } : defaultSettings;
        console.log('Creating timer with settings:', mergedSettings);
        return new Timer(mergedSettings, setTimerState);
    });

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

    const progress = calculateProgress(
        timerState.timeRemaining,
        timer.getDurationForPhase(timerState.phase)
    );

    return (
        <div className="main-timer">
            <div className="phase-indicator">
                {getPhaseLabel(timerState.phase)}
            </div>
            <div className="timer-display">
                {formatTime(timerState.timeRemaining)}
            </div>
            <div className="progress-bar">
                <div 
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="pomodoro-count">
                今日完成：{timerState.completedPomodoros} 个番茄钟
            </div>
            <div className="controls">
                <button onClick={handleToggleTimer}>
                    {timerState.isRunning ? '暂停' : '开始'}
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
    );
};

export default MainTimer; 