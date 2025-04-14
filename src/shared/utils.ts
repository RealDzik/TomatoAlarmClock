import { TimerPhase } from './types';

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function padZero(num: number): string {
    return num.toString().padStart(2, '0');
}

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function getPhaseLabel(phase: TimerPhase): string {
    switch (phase) {
        case TimerPhase.WORK: return '工作中';
        case TimerPhase.SHORT_BREAK: return '短休息';
        case TimerPhase.LONG_BREAK: return '长休息';
        default: return '';
    }
}

export function calculateProgress(timeRemaining: number, totalDuration: number): number {
    if (totalDuration <= 0) return 0;
    return Math.max(0, 100 - (timeRemaining / totalDuration) * 100);
}

export function getCurrentDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
} 