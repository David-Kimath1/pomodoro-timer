// Notifications Module - Professional browser notifications

const NotificationManager = {
    permission: false,

    async requestPermission() {
        if (!('Notification' in window)) return false;
        
        if (Notification.permission === 'granted') {
            this.permission = true;
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const result = await Notification.requestPermission();
            this.permission = result === 'granted';
            return this.permission;
        }
        
        return false;
    },

    send(title, body, icon = null) {
        if (!this.permission) return;
        
        const options = {
            body: body,
            icon: icon || 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <rect width="100" height="100" rx="20" fill="#1a1a2e"/>
                    <circle cx="50" cy="45" r="25" fill="none" stroke="#a78bfa" stroke-width="6"/>
                    <line x1="50" y1="45" x2="50" y2="25" stroke="#a78bfa" stroke-width="5" stroke-linecap="round"/>
                    <line x1="50" y1="45" x2="62" y2="38" stroke="#a78bfa" stroke-width="4" stroke-linecap="round"/>
                </svg>
            `),
            badge: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <rect width="100" height="100" rx="20" fill="#a78bfa"/>
                </svg>
            `),
            silent: false,
            requireInteraction: false,
            tag: 'pomodoro-session'
        };
        
        try {
            const notification = new Notification(title, options);
            
            // Auto-close after 8 seconds
            setTimeout(() => {
                notification.close();
            }, 8000);
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (e) {
            console.log('Notification error:', e);
        }
    },

    // Focus session completed
    notifyFocusComplete(sessionCount) {
        this.send(
            'Focus Session Complete',
            'Time for a break. You have completed ' + sessionCount + ' session' + (sessionCount > 1 ? 's' : '') + ' today.'
        );
    },

    // Short break over
    notifyShortBreakOver() {
        this.send(
            'Break Finished',
            'Your short break is over. Ready to start the next focus session?'
        );
    },

    // Long break over
    notifyLongBreakOver() {
        this.send(
            'Long Break Finished',
            'Your long break is complete. You should feel refreshed and ready to focus.'
        );
    },

    // Session complete notification
    notifySessionComplete(mode, sessionCount) {
        switch (mode) {
            case 'focus':
                this.notifyFocusComplete(sessionCount);
                break;
            case 'shortBreak':
                this.notifyShortBreakOver();
                break;
            case 'longBreak':
                this.notifyLongBreakOver();
                break;
            default:
                this.send('Pomodoro Timer', 'Session complete.');
        }
    },

    // Daily goal reached
    notifyGoalReached(goal) {
        this.send(
            'Daily Goal Achieved',
            'Congratulations! You have completed all ' + goal + ' focus sessions for today.'
        );
    }
};