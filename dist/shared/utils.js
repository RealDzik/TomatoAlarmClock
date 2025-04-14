"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTime = formatTime;
exports.padZero = padZero;
exports.formatDate = formatDate;
exports.getPhaseLabel = getPhaseLabel;
exports.calculateProgress = calculateProgress;
exports.getCurrentDateString = getCurrentDateString;
const types_1 = require("./types");
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
function padZero(num) {
    return num.toString().padStart(2, '0');
}
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
function getPhaseLabel(phase) {
    switch (phase) {
        case types_1.TimerPhase.WORK: return '工作中';
        case types_1.TimerPhase.SHORT_BREAK: return '短休息';
        case types_1.TimerPhase.LONG_BREAK: return '长休息';
        default: return '';
    }
}
function calculateProgress(timeRemaining, totalDuration) {
    if (totalDuration <= 0)
        return 0;
    return Math.max(0, 100 - (timeRemaining / totalDuration) * 100);
}
function getCurrentDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
//# sourceMappingURL=utils.js.map