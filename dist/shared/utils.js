"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTime = formatTime;
exports.padZero = padZero;
exports.formatDate = formatDate;
exports.getPhaseLabel = getPhaseLabel;
exports.calculateProgress = calculateProgress;
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
}
function padZero(num) {
    return num.toString().padStart(2, '0');
}
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
function getPhaseLabel(phase) {
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
function calculateProgress(timeRemaining, totalDuration) {
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
}
//# sourceMappingURL=utils.js.map