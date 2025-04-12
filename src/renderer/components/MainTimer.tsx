import React, { useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';
import { TimerSettings, TimerState, TimerPhase } from '../../shared/types';
import { formatTime, getPhaseLabel, calculateProgress } from '../../shared/utils';
import { Timer } from '../timer';

interface MainTimerProps {
    settings: TimerSettings;
}

const MainTimer: React.FC<MainTimerProps> = ({ settings }) => {
    const [timerState, setTimerState] = useState<TimerState>(() => ({
        phase: TimerPhase.WORK,
        timeRemaining: (settings?.workDuration || 25) * 60,
        isRunning: false,
        completedPomodoros: 0
    }));

    const [timer] = useState(() => new Timer(settings, setTimerState));

    useEffect(() => {
        if (settings) {
            timer.updateSettings(settings);
        }
    }, [settings, timer]);

    useEffect(() => {
        const handleToggleTimer = () => {
            timerState.isRunning ? timer.pause() : timer.start();
        };

        const handleSkipPhase = () => {
            timer.skipPhase();
        };

        ipcRenderer.on('toggle-timer', handleToggleTimer);
        ipcRenderer.on('skip-phase', handleSkipPhase);

        return () => {
            ipcRenderer.removeListener('toggle-timer', handleToggleTimer);
            ipcRenderer.removeListener('skip-phase', handleSkipPhase);
        };
    }, [timer, timerState.isRunning]);

    if (!settings) {
        return <div>加载设置中...</div>;
    }

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
                <button onClick={() => timerState.isRunning ? timer.pause() : timer.start()}>
                    {timerState.isRunning ? '暂停' : '开始'}
                </button>
                <button onClick={() => timer.skipPhase()}>
                    跳过
                </button>
                <button onClick={() => timer.reset()}>
                    重置
                </button>
            </div>
        </div>
    );
};

export default MainTimer; 