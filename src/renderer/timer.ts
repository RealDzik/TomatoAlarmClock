import { ipcRenderer } from 'electron';
import { TimerPhase, TimerState, TimerSettings, WorkBlock } from '../shared/types';
import { getCurrentDateString } from '../shared/utils';
import { v4 as uuidv4 } from 'uuid';

export class Timer {
    private state: TimerState;
    private settings: TimerSettings;
    private interval: NodeJS.Timeout | null = null;
    private onStateChange: (state: TimerState) => void;
    private accumulatedWorkTime = 0;
    private accumulatedBreakTime = 0;
    private accumulationInterval = 60;
    private secondsAccumulated = 0;
    private activeWorkBlock: WorkBlock | null = null;

    constructor(settings: TimerSettings, onStateChange: (state: TimerState) => void) {
        this.settings = settings;
        this.onStateChange = onStateChange;
        this.state = {
            phase: TimerPhase.WORK,
            timeRemaining: settings.workDuration * 60,
            isRunning: false,
            completedPomodoros: 0,
            activeWorkBlock: null
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
        if (this.state.isRunning) return;

        if (this.interval) {
            clearInterval(this.interval);
        }

        if (this.state.phase === TimerPhase.WORK && !this.activeWorkBlock) {
            this.activeWorkBlock = {
                id: uuidv4(),
                startTime: Date.now(),
                text: '进行中的工作...'
            };
            console.log('Created active work block:', this.activeWorkBlock.id);
        }

        this.state = {
            ...this.state,
            isRunning: true,
            activeWorkBlock: this.activeWorkBlock
        };
        this.secondsAccumulated = 0;

        this.interval = setInterval(() => {
            if (this.state.timeRemaining > 0) {
                this.state.timeRemaining--;
                this.secondsAccumulated++;

                if (this.secondsAccumulated >= this.accumulationInterval) {
                    this.recordAccumulatedTime();
                    this.secondsAccumulated = 0;
                }

                console.log('Tick - Time remaining:', this.state.timeRemaining);
                this.onStateChange({...this.state});
                this.updateTrayTime();
            } else {
                this.recordAccumulatedTime(true);
                this.secondsAccumulated = 0;
                this.onPhaseComplete();
            }
        }, 1000);

        console.log('Timer started successfully');
        this.onStateChange({...this.state});
        this.updateTrayTime();
    }

    private recordAccumulatedTime(isPhaseEnd: boolean = false): void {
        const elapsedSeconds = isPhaseEnd ? this.getDurationForPhase(this.state.phase) - this.state.timeRemaining : this.secondsAccumulated;
        if (elapsedSeconds <= 0) return;

        const today = getCurrentDateString();
        if (this.state.phase === TimerPhase.WORK) {
            this.accumulatedWorkTime += elapsedSeconds;
            ipcRenderer.invoke('add-daily-stats', today, 'workTime', elapsedSeconds).catch(console.error);
            console.log(`Recorded ${elapsedSeconds}s of work time.`);
        } else {
            this.accumulatedBreakTime += elapsedSeconds;
            ipcRenderer.invoke('add-daily-stats', today, 'breakTime', elapsedSeconds).catch(console.error);
            console.log(`Recorded ${elapsedSeconds}s of break time.`);
        }
    }

    private completeAndSaveActiveBlock(): void {
        if (this.activeWorkBlock) {
            this.activeWorkBlock.endTime = Date.now();
            const today = getCurrentDateString();
            console.log('Completing and saving work block:', this.activeWorkBlock.id);
            ipcRenderer.invoke('update-work-block', today, { ...this.activeWorkBlock }).catch(console.error);
            this.activeWorkBlock = null;
        }
    }

    public pause(): void {
        console.log('Pausing timer...');
        if (this.state.isRunning) {
            this.state.isRunning = false;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            this.recordAccumulatedTime();
            this.secondsAccumulated = 0;
            this.state.activeWorkBlock = this.activeWorkBlock;
            this.onStateChange({...this.state});
            this.updateTrayTime();
            console.log('Timer paused, updating state');
        }
    }

    public reset(): void {
        this.pause();
        this.completeAndSaveActiveBlock();
        this.state.phase = TimerPhase.WORK;
        this.state.timeRemaining = this.getDurationForPhase(TimerPhase.WORK);
        this.state.completedPomodoros = 0;
        this.accumulatedWorkTime = 0;
        this.accumulatedBreakTime = 0;
        this.state.activeWorkBlock = null;
        this.onStateChange({...this.state});
        this.updateTrayTime();
    }

    public skipPhase(): void {
        this.pause();
        this.completeAndSaveActiveBlock();
        this.moveToNextPhase();
        this.state.activeWorkBlock = null;
        this.onStateChange({...this.state});
        this.updateTrayTime();
    }

    private onPhaseComplete(): void {
        const today = getCurrentDateString();

        if (this.state.phase === TimerPhase.WORK) {
            this.completeAndSaveActiveBlock();
            this.state.completedPomodoros++;
            ipcRenderer.invoke('add-daily-stats', today, 'pomodoro', 1).catch(console.error);
        }

        this.sendNotification();

        const shouldAutoStart = this.state.phase === TimerPhase.WORK
            ? this.settings.autoStartBreak
            : this.settings.autoStartWork;

        this.moveToNextPhase();
        this.state.activeWorkBlock = null;

        if (shouldAutoStart) {
            this.start();
        } else {
            this.state.isRunning = false;
            this.onStateChange({...this.state});
            this.updateTrayTime();
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
    }

    private shouldTakeLongBreak(): boolean {
        return this.state.completedPomodoros > 0 && this.state.completedPomodoros % this.settings.longBreakInterval === 0;
    }

    public getDurationForPhase(phase: TimerPhase): number {
        switch (phase) {
            case TimerPhase.WORK:
                return this.settings.workDuration * 60;
            case TimerPhase.SHORT_BREAK:
                return this.settings.shortBreakDuration * 60;
            case TimerPhase.LONG_BREAK:
                return this.settings.longBreakDuration * 60;
            default:
                return this.settings.workDuration * 60;
        }
    }

    private sendNotification(): void {
        if (!this.settings.notificationEnabled) return;

        let message = '';
        switch (this.state.phase) {
            case TimerPhase.WORK:
                message = `工作时间结束，已完成 ${this.state.completedPomodoros} 个番茄钟！请休息一下！`;
                break;
            case TimerPhase.SHORT_BREAK:
                message = '短休息结束，继续工作吧！';
                break;
            case TimerPhase.LONG_BREAK:
                message = '长休息结束，开始新的工作循环！';
                break;
        }
        if (message) {
            new Notification('番茄闹钟', { body: message });
        }

        if (this.settings.soundEnabled) {
            try {
                const audioPath = '../assets/notification.mp3';
                const audio = new Audio(audioPath);
                audio.play().catch(e => console.error("Error playing sound:", e));
            } catch (e) {
                console.error("Could not create audio element:", e);
            }
        }
    }

    public getState(): TimerState {
        return { ...this.state };
    }

    public updateSettings(settings: TimerSettings): void {
        const workDurationChanged = this.settings.workDuration !== settings.workDuration;
        this.settings = settings;
        if (!this.state.isRunning) {
            this.state.timeRemaining = this.getDurationForPhase(this.state.phase);
            this.state.activeWorkBlock = this.activeWorkBlock;
            this.onStateChange({...this.state});
            this.updateTrayTime();
        }
        console.log('Timer settings updated:', this.settings);
    }

    public setCompletedPomodoros(count: number): void {
        if (this.state.completedPomodoros !== count) {
            this.state.completedPomodoros = count;
            this.state.activeWorkBlock = this.activeWorkBlock;
            this.onStateChange({ ...this.state });
            console.log('Completed pomodoros set to:', count);
        }
    }

    public setActiveWorkBlockText(text: string): void {
        if (this.activeWorkBlock && this.activeWorkBlock.text !== text) {
            this.activeWorkBlock.text = text;
            this.state.activeWorkBlock = this.activeWorkBlock;
            console.log('Active work block text updated internally to:', text);
        }
    }
} 