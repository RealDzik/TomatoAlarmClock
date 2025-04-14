import Store from 'electron-store';
import { TimerSettings, DailyStats, WorkBlock } from '../shared/types';

const store = new Store({
    defaults: {
        settings: {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 30,
            longBreakInterval: 4,
            autoStartBreak: true,
            autoStartWork: true,
            soundEnabled: true,
            notificationEnabled: true,
            autoStartWithSystem: false
        } as TimerSettings,
        stats: [] as DailyStats[]
    }
});

export function getSettings(): TimerSettings {
    return store.get('settings') as TimerSettings;
}

export function saveSettings(settings: TimerSettings): void {
    store.set('settings', settings);
}

export function getDailyStats(): DailyStats[] {
    const stats = store.get('stats') as DailyStats[];
    return Array.isArray(stats) ? stats.map(s => ({ ...s, workBlocks: s.workBlocks || [] })) : [];
}

export function addDailyStats(stats: DailyStats): void {
    const currentStats = getDailyStats();
    const existingIndex = currentStats.findIndex(s => s.date === stats.date);
    
    if (existingIndex >= 0) {
        currentStats[existingIndex] = { ...currentStats[existingIndex], ...stats };
    } else {
        currentStats.push({ ...stats, workBlocks: stats.workBlocks || [] });
    }
    
    store.set('stats', currentStats);
}

export function clearStats(): void {
    store.set('stats', []);
} 