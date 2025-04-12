export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
}

export function padZero(num: number): string {
    return num.toString().padStart(2, '0');
}

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function getPhaseLabel(phase: string): string {
    switch (phase) {
        case 'work':
            return '工作中';
        case 'short-break':
            return '短休息';
        case 'long-break':
            return '长休息';
        default:
            return '';
    }
}

export function calculateProgress(timeRemaining: number, totalDuration: number): number {
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
} 