import React from 'react';
import { TimerSettings } from '../../shared/types';

interface SettingsProps {
    settings: TimerSettings;
    onSettingsChange: (settings: TimerSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
    const handleChange = (key: keyof TimerSettings, value: number | boolean) => {
        onSettingsChange({
            ...settings,
            [key]: value
        });
    };

    return (
        <div className="settings">
            <h2>时间设置（分钟）</h2>
            <div className="setting-item">
                <label>工作时长：</label>
                <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.workDuration}
                    onChange={(e) => handleChange('workDuration', parseInt(e.target.value))}
                />
            </div>
            <div className="setting-item">
                <label>短休息时长：</label>
                <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreakDuration}
                    onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value))}
                />
            </div>
            <div className="setting-item">
                <label>长休息时长：</label>
                <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value))}
                />
            </div>
            <div className="setting-item">
                <label>长休息间隔（番茄钟数）：</label>
                <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.longBreakInterval}
                    onChange={(e) => handleChange('longBreakInterval', parseInt(e.target.value))}
                />
            </div>

            <h2>自动化设置</h2>
            <div className="setting-item">
                <label>
                    <input
                        type="checkbox"
                        checked={settings.autoStartBreak}
                        onChange={(e) => handleChange('autoStartBreak', e.target.checked)}
                    />
                    自动开始休息
                </label>
            </div>
            <div className="setting-item">
                <label>
                    <input
                        type="checkbox"
                        checked={settings.autoStartWork}
                        onChange={(e) => handleChange('autoStartWork', e.target.checked)}
                    />
                    自动开始工作
                </label>
            </div>

            <h2>通知设置</h2>
            <div className="setting-item">
                <label>
                    <input
                        type="checkbox"
                        checked={settings.soundEnabled}
                        onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                    />
                    启用提示音
                </label>
            </div>
            <div className="setting-item">
                <label>
                    <input
                        type="checkbox"
                        checked={settings.notificationEnabled}
                        onChange={(e) => handleChange('notificationEnabled', e.target.checked)}
                    />
                    启用桌面通知
                </label>
            </div>
        </div>
    );
};

export default Settings; 