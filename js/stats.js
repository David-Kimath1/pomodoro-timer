// Stats Module - Handles statistics and charts

const StatsManager = {
    stats: null,

    init() {
        this.stats = Storage.getStats();
        this.checkStreak();
    },

    // Record a completed focus session
    recordSession() {
        this.stats = Storage.getStats();
        const today = Storage.getTodayDate();
        
        this.stats.totalSessions++;
        this.stats.totalFocusTime += 25; // Default focus time
        
        if (!this.stats.dailyHistory[today]) {
            this.stats.dailyHistory[today] = 0;
        }
        this.stats.dailyHistory[today]++;
        
        this.stats.lastActiveDate = today;
        this.checkStreak();
        Storage.saveStats(this.stats);
    },

    // Check and update streak
    checkStreak() {
        const today = Storage.getTodayDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (!this.stats.lastActiveDate) {
            this.stats.currentStreak = 0;
        } else if (this.stats.lastActiveDate === yesterdayStr) {
            this.stats.currentStreak++;
        } else if (this.stats.lastActiveDate !== today) {
            this.stats.currentStreak = 0;
        }
        
        if (this.stats.currentStreak > this.stats.bestStreak) {
            this.stats.bestStreak = this.stats.currentStreak;
        }
        
        Storage.saveStats(this.stats);
    },

    // Get today's sessions
    getTodaySessions() {
        const today = Storage.getTodayDate();
        return this.stats.dailyHistory[today] || 0;
    },

    // Get weekly data for chart
    getWeeklyData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = days[date.getDay()];
            const sessions = this.stats.dailyHistory[dateStr] || 0;
            data.push({ day: dayName, sessions });
        }
        
        return data;
    },

    // Get task breakdown
    getTaskBreakdown() {
        const breakdown = this.stats.taskBreakdown || {};
        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
        
        return Object.entries(breakdown).map(([category, count]) => ({
            category,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }));
    },

    // Format hours
    formatHours(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    },

    // Render stats modal
    render() {
        this.stats = Storage.getStats();
        
        document.getElementById('totalFocusTime').textContent = this.formatHours(this.stats.totalFocusTime * 25);
        document.getElementById('totalSessions').textContent = this.stats.totalSessions;
        document.getElementById('currentStreak').textContent = this.stats.currentStreak;
        document.getElementById('bestStreak').textContent = this.stats.bestStreak;
        
        this.renderWeeklyChart();
        this.renderTaskBreakdown();
    },

    // Render weekly chart
    renderWeeklyChart() {
        const chart = document.getElementById('weeklyChart');
        const weeklyData = this.getWeeklyData();
        const maxSessions = Math.max(...weeklyData.map(d => d.sessions), 1);
        
        chart.innerHTML = weeklyData.map(data => `
            <div class="chart-bar-row">
                <span class="chart-label">${data.day}</span>
                <div class="chart-bar-container">
                    <div class="chart-bar" style="width: ${(data.sessions / maxSessions) * 100}%">
                        ${data.sessions > 0 ? data.sessions : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Render task breakdown
    renderTaskBreakdown() {
        const breakdown = this.getTaskBreakdown();
        const container = document.getElementById('taskBreakdown');
        
        if (breakdown.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No data yet</p>';
            return;
        }
        
        container.innerHTML = breakdown.map(item => `
            <div class="breakdown-item">
                <span class="breakdown-name">${item.category}</span>
                <span class="breakdown-value">${item.count} sessions (${item.percentage}%)</span>
            </div>
        `).join('');
    }
};