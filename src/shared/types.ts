export enum TimerPhase {
    WORK = 'work',
    SHORT_BREAK = 'short-break',
    LONG_BREAK = 'long-break'
}

export interface TimerSettings {
    workDuration: number;      // 工作时长（分钟）
    shortBreakDuration: number; // 短休息时长（分钟）
    longBreakDuration: number;  // 长休息时长（分钟）
    longBreakInterval: number;  // 长休息间隔（番茄钟数量）
    autoStartBreak: boolean;    // 是否自动开始休息
    autoStartWork: boolean;     // 是否自动开始工作
    soundEnabled: boolean;      // 是否启用声音
    notificationEnabled: boolean; // 是否启用通知
}

export interface TimerState {
    phase: TimerPhase;
    timeRemaining: number;     // 剩余时间（秒）
    isRunning: boolean;
    completedPomodoros: number;
}

export interface DailyStats {
    date: string;
    completedPomodoros: number;
    totalWorkTime: number;     // 总工作时间（分钟）
    totalBreakTime: number;    // 总休息时间（分钟）
} 