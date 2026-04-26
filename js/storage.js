// Storage Module - Handles all localStorage operations

const Storage = {
    // Default settings
    defaultSettings: {
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        dailyGoal: 6,
        autoStartBreaks: true,
        autoStartFocus: true,
        alertSound: 'bell',
        theme: 'midnight',
        volume: 50
    },

    // Get settings
    getSettings() {
        const saved = localStorage.getItem('pomodoroSettings');
        if (saved) {
            return { ...this.defaultSettings, ...JSON.parse(saved) };
        }
        return { ...this.defaultSettings };
    },

    // Save settings
    saveSettings(settings) {
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    },

    // Get tasks
    getTasks() {
        const saved = localStorage.getItem('pomodoroTasks');
        return saved ? JSON.parse(saved) : [];
    },

    // Save tasks
    saveTasks(tasks) {
        localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    },

    // Get statistics
    getStats() {
        const saved = localStorage.getItem('pomodoroStats');
        if (saved) return JSON.parse(saved);
        return {
            totalSessions: 0,
            totalFocusTime: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastActiveDate: null,
            dailyHistory: {},
            weeklyHistory: {},
            taskBreakdown: {}
        };
    },

    // Save statistics
    saveStats(stats) {
        localStorage.setItem('pomodoroStats', JSON.stringify(stats));
    },

    // Get today's session count
    getTodaySessions() {
        const today = this.getTodayDate();
        const stats = this.getStats();
        return stats.dailyHistory[today] || 0;
    },

    // Get today's date string
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    },

    // Export all data
    exportData() {
        return {
            settings: this.getSettings(),
            tasks: this.getTasks(),
            stats: this.getStats(),
            exportDate: new Date().toISOString()
        };
    },

    // Import data
    importData(data) {
        if (data.settings) this.saveSettings(data.settings);
        if (data.tasks) this.saveTasks(data.tasks);
        if (data.stats) this.saveStats(data.stats);
    },

    // Clear all data
    clearAll() {
        localStorage.removeItem('pomodoroSettings');
        localStorage.removeItem('pomodoroTasks');
        localStorage.removeItem('pomodoroStats');
    }
};