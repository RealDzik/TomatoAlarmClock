import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { DailyStats } from '../../shared/types';
import { formatDate } from '../../shared/utils';

const Statistics: React.FC = () => {
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

    useEffect(() => {
        const loadStats = () => {
            try {
                const data = ipcRenderer.sendSync('electron-store-get-data');
                const allStats = data.stats || [];
                const today = new Date();
                const filteredStats = allStats.filter((stat: DailyStats) => {
                    const statDate = new Date(stat.date);
                    switch (selectedPeriod) {
                        case 'today':
                            return formatDate(statDate) === formatDate(today);
                        case 'week':
                            const weekAgo = new Date(today);
                            weekAgo.setDate(today.getDate() - 7);
                            return statDate >= weekAgo;
                        case 'month':
                            const monthAgo = new Date(today);
                            monthAgo.setMonth(today.getMonth() - 1);
                            return statDate >= monthAgo;
                        default:
                            return false;
                    }
                });
                setStats(filteredStats);
            } catch (error) {
                console.error('加载统计数据失败:', error);
                setStats([]);
            }
        };

        loadStats();
    }, [selectedPeriod]);

    const calculateTotalStats = () => {
        return stats.reduce((acc, stat) => ({
            completedPomodoros: acc.completedPomodoros + stat.completedPomodoros,
            totalWorkTime: acc.totalWorkTime + stat.totalWorkTime,
            totalBreakTime: acc.totalBreakTime + stat.totalBreakTime
        }), {
            completedPomodoros: 0,
            totalWorkTime: 0,
            totalBreakTime: 0
        });
    };

    const totals = calculateTotalStats();

    return (
        <div className="statistics">
            <h2>统计</h2>
            <div className="period-selector">
                <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'week' | 'month')}
                >
                    <option value="today">今天</option>
                    <option value="week">本周</option>
                    <option value="month">本月</option>
                </select>
            </div>
            <div className="stats-summary">
                <div className="stat-item">
                    <label>完成的番茄钟数：</label>
                    <span>{totals.completedPomodoros}</span>
                </div>
                <div className="stat-item">
                    <label>总工作时间：</label>
                    <span>{Math.round(totals.totalWorkTime / 60)}分钟</span>
                </div>
                <div className="stat-item">
                    <label>总休息时间：</label>
                    <span>{Math.round(totals.totalBreakTime / 60)}分钟</span>
                </div>
            </div>
        </div>
    );
};

export default Statistics; 