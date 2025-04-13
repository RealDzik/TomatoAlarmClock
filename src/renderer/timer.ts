import { ipcRenderer } from 'electron';
import { TimerPhase, TimerState, TimerSettings } from '../shared/types';

export class Timer {
    private state: TimerState;
    private settings: TimerSettings;
    private interval: NodeJS.Timeout | null = null;
    private onStateChange: (state: TimerState) => void;

    constructor(settings: TimerSettings, onStateChange: (state: TimerState) => void) {
        this.settings = settings;
        this.onStateChange = onStateChange;
        this.state = {
            phase: TimerPhase.WORK,
            timeRemaining: settings.workDuration * 60,
            isRunning: false,
            completedPomodoros: 0
        };
        console.log('Timer initialized with settings:', settings);
    }

    private updateTrayTime(): void {
        ipcRenderer.send('update-tray-time', {
            timeRemaining: this.state.timeRemaining,
            isRunning: this.state.isRunning
        });
    }

    public start(): void {
        console.log('Starting timer...');
        if (this.interval) {
            console.log('Timer already running, clearing existing interval');
            clearInterval(this.interval);
            this.interval = null;
        }
        
        this.state = {
            ...this.state,
            isRunning: true
        };
        
        this.interval = setInterval(() => {
            if (this.state.timeRemaining > 0) {
                this.state.timeRemaining--;
                console.log('Tick - Time remaining:', this.state.timeRemaining);
                this.onStateChange({...this.state});
                this.updateTrayTime();
            } else {
                this.onPhaseComplete();
            }
        }, 1000);
        
        console.log('Timer started successfully');
        this.onStateChange({...this.state});
        this.updateTrayTime();
    }

    public pause(): void {
        console.log('Pausing timer...');
        if (this.state.isRunning) {
            this.state.isRunning = false;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            console.log('Timer paused, updating state');
            this.onStateChange({...this.state});
            this.updateTrayTime();
        }
    }

    public reset(): void {
        this.pause();
        this.state.timeRemaining = this.getDurationForPhase(this.state.phase);
        this.onStateChange(this.state);
        this.updateTrayTime();
    }

    public skipPhase(): void {
        this.pause();
        this.moveToNextPhase();
        this.updateTrayTime();
    }

    private tick(): void {
        if (this.state.timeRemaining > 0) {
            this.state.timeRemaining--;
            this.onStateChange(this.state);
        } else {
            this.onPhaseComplete();
        }
    }

    private onPhaseComplete(): void {
        this.pause();
        
        if (this.state.phase === TimerPhase.WORK) {
            this.state.completedPomodoros++;
        }

        // 发送通知
        this.sendNotification();

        // 根据设置决定是否自动开始下一阶段
        const shouldAutoStart = this.state.phase === TimerPhase.WORK 
            ? this.settings.autoStartBreak 
            : this.settings.autoStartWork;

        this.moveToNextPhase();

        if (shouldAutoStart) {
            this.start();
        }
    }

    private moveToNextPhase(): void {
        switch (this.state.phase) {
            case TimerPhase.WORK:
                this.state.phase = this.shouldTakeLongBreak() 
                    ? TimerPhase.LONG_BREAK 
                    : TimerPhase.SHORT_BREAK;
                break;
            case TimerPhase.SHORT_BREAK:
            case TimerPhase.LONG_BREAK:
                this.state.phase = TimerPhase.WORK;
                break;
        }

        this.state.timeRemaining = this.getDurationForPhase(this.state.phase);
        this.onStateChange(this.state);
        this.updateTrayTime();
    }

    private shouldTakeLongBreak(): boolean {
        return this.state.completedPomodoros % this.settings.longBreakInterval === 0;
    }

    public getDurationForPhase(phase: TimerPhase): number {
        switch (phase) {
            case TimerPhase.WORK:
                return this.settings.workDuration * 60;
            case TimerPhase.SHORT_BREAK:
                return this.settings.shortBreakDuration * 60;
            case TimerPhase.LONG_BREAK:
                return this.settings.longBreakDuration * 60;
        }
    }

    private sendNotification(): void {
        if (!this.settings.notificationEnabled) return;

        let message = '';
        switch (this.state.phase) {
            case TimerPhase.WORK:
                message = '工作时间结束，请休息一下！';
                break;
            case TimerPhase.SHORT_BREAK:
                message = '短休息结束，继续工作吧！';
                break;
            case TimerPhase.LONG_BREAK:
                message = '长休息结束，开始新的工作循环！';
                break;
        }

        new Notification('番茄闹钟', { body: message });
        
        if (this.settings.soundEnabled) {
            // 播放提示音
            const audio = new Audio('../assets/notification.mp3');
            audio.play();
        }
    }

    public getState(): TimerState {
        return { ...this.state };
    }

    public updateSettings(settings: TimerSettings): void {
        this.settings = settings;
        // 如果更新了时间设置，需要重置当前阶段的剩余时间
        if (!this.state.isRunning) {
            this.state.timeRemaining = this.getDurationForPhase(this.state.phase);
            this.onStateChange(this.state);
        }
    }
} 