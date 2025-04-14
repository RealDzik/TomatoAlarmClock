"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.saveSettings = saveSettings;
exports.getDailyStats = getDailyStats;
exports.addDailyStats = addDailyStats;
exports.clearStats = clearStats;
const electron_store_1 = __importDefault(require("electron-store"));
const store = new electron_store_1.default({
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
        },
        stats: []
    }
});
function getSettings() {
    return store.get('settings');
}
function saveSettings(settings) {
    store.set('settings', settings);
}
function getDailyStats() {
    const stats = store.get('stats');
    return Array.isArray(stats) ? stats : [];
}
function addDailyStats(stats) {
    const currentStats = getDailyStats();
    const existingIndex = currentStats.findIndex(s => s.date === stats.date);
    if (existingIndex >= 0) {
        currentStats[existingIndex] = stats;
    }
    else {
        currentStats.push(stats);
    }
    store.set('stats', currentStats);
}
function clearStats() {
    store.set('stats', []);
}
//# sourceMappingURL=store.js.map