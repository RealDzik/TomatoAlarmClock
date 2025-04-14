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
    autoStartWithSystem: boolean;  // 新增：开机自启动设置
}

export interface TimerState {
    phase: TimerPhase;
    timeRemaining: number;     // 剩余时间（秒）
    isRunning: boolean;
    completedPomodoros: number;
    activeWorkBlock?: WorkBlock | null; // 新增：当前活动的工作块
}

export interface WorkBlock {
    id: string; // 使用时间戳或UUID确保唯一性
    startTime: number; // 使用 Unix timestamp (milliseconds)
    endTime?: number; // 可选的结束时间戳
    text: string; // 工作块的描述文字
}

export interface DailyStats {
    date: string; // YYYY-MM-DD
    completedPomodoros: number;
    totalWorkTime: number; // in seconds or minutes? let's assume seconds for now
    totalBreakTime: number; // in seconds
    workBlocks: WorkBlock[]; // 添加工作块列表
} 