// Timer Module - Core timer logic

const Timer = {
    duration: 25 * 60, // in seconds
    remaining: 25 * 60,
    isRunning: false,
    mode: 'focus', // focus, shortBreak, longBreak
    intervalId: null,
    sessionCount: 0,
    settings: null,

    // DOM Elements
    timerText: null,
    timerMode: null,
    progressRing: null,
    playBtn: null,
    progressDots: null,
    progressText: null,

    init() {
        this.timerText = document.getElementById('timerText');
        this.timerMode = document.getElementById('timerMode');
        this.progressRing = document.getElementById('progressRing');
        this.playBtn = document.getElementById('playBtn');
        this.progressDots = document.getElementById('progressDots');
        this.progressText = document.getElementById('progressText');
        
        this.settings = Storage.getSettings();
        this.switchMode('focus');
        this.updateDisplay();
        this.updateProgressDots();
    },

    // Start timer
    start() {
        if (this.isRunning) return this.pause();
        
        // Resume audio context if suspended
        if (SoundManager.audioContext && SoundManager.audioContext.state === 'suspended') {
            SoundManager.audioContext.resume();
        }
        
        this.isRunning = true;
        this.updatePlayButton();
        
        this.intervalId = setInterval(() => {
            this.remaining--;
            this.updateDisplay();
            
            if (this.remaining <= 0) {
                this.complete();
            }
        }, 1000);
    },

    // Pause timer
    pause() {
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.updatePlayButton();
    },

    // Reset timer
    reset() {
        this.pause();
        this.remaining = this.duration;
        this.updateDisplay();
    },

    // Skip to next session
    skip() {
        this.pause();
        this.complete();
    },

    // Complete current session
  // Complete current session
complete() {
    this.pause();
    
    // Play alert sound
    SoundManager.playAlert(this.settings.alertSound);
    
    // Send notification
    NotificationManager.notifySessionComplete(this.mode, this.sessionCount);
    
    if (this.mode === 'focus') {
        this.sessionCount++;
        StatsManager.recordSession();
        TaskManager.incrementPomodoro();
        this.updateProgressDots();
        
        // Check daily goal
        if (this.sessionCount >= this.settings.dailyGoal) {
            setTimeout(() => {
                NotificationManager.notifyGoalReached(this.settings.dailyGoal);
            }, 1000);
        }
        
        // Switch to break
        if (this.sessionCount % this.settings.longBreakInterval === 0) {
            this.switchMode('longBreak');
        } else {
            this.switchMode('shortBreak');
        }
    } else {
        this.switchMode('focus');
    }
    
    // Auto-start if enabled
    if ((this.mode === 'focus' && this.settings.autoStartFocus) ||
        (this.mode !== 'focus' && this.settings.autoStartBreaks)) {
        setTimeout(() => this.start(), 1000);
    }
},

    // Switch timer mode
    switchMode(mode) {
        this.mode = mode;
        this.pause();
        
        switch (mode) {
            case 'focus':
                this.duration = this.settings.focusDuration * 60;
                break;
            case 'shortBreak':
                this.duration = this.settings.shortBreakDuration * 60;
                break;
            case 'longBreak':
                this.duration = this.settings.longBreakDuration * 60;
                break;
        }
        
        this.remaining = this.duration;
        this.updateDisplay();
        this.updateModeTabs();
    },

    // Update timer display
    updateDisplay() {
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        
        this.timerText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Update mode text
        const modeNames = {
            focus: 'Focus Time',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };
        this.timerMode.textContent = modeNames[this.mode];
        
        // Update progress ring
        const circumference = 565.48;
        const progress = this.remaining / this.duration;
        const offset = circumference * (1 - progress);
        this.progressRing.style.strokeDashoffset = offset;
        
        // Update document title
        document.title = `${this.timerText.textContent} - ${modeNames[this.mode]} | Pomodoro`;
    },

    // Update play button icon
    updatePlayButton() {
        const icon = this.playBtn.querySelector('i');
        if (this.isRunning) {
            icon.className = 'fa-solid fa-pause';
        } else {
            icon.className = 'fa-solid fa-play';
        }
    },

    // Update mode tabs
    updateModeTabs() {
        document.querySelectorAll('.session-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.mode === this.mode) {
                tab.classList.add('active');
            }
        });
    },

    // Update session progress dots
    updateProgressDots() {
        const goal = this.settings.dailyGoal;
        const completed = this.sessionCount;
        const inCurrentSession = this.mode === 'focus';
        
        let dotsHTML = '';
        for (let i = 0; i < goal; i++) {
            if (i < completed) {
                dotsHTML += '<span class="dot completed"></span>';
            } else if (i === completed && inCurrentSession) {
                dotsHTML += '<span class="dot active"></span>';
            } else {
                dotsHTML += '<span class="dot"></span>';
            }
        }
        
        this.progressDots.innerHTML = dotsHTML;
        this.progressText.textContent = `${completed} of ${goal}`;
    },

    // Get next mode
    getNextMode() {
        if (this.mode === 'focus') {
            if ((this.sessionCount + 1) % this.settings.longBreakInterval === 0) {
                return 'longBreak';
            }
            return 'shortBreak';
        }
        return 'focus';
    },

    // Update settings
    updateSettings(newSettings) {
        this.settings = newSettings;
        
        // Update time labels
        document.getElementById('focusTimeLabel').textContent = `${newSettings.focusDuration}:00`;
        document.getElementById('shortBreakTimeLabel').textContent = `${newSettings.shortBreakDuration}:00`;
        document.getElementById('longBreakTimeLabel').textContent = `${newSettings.longBreakDuration}:00`;
        
        // Reset timer with new duration
        this.switchMode(this.mode);
        this.updateProgressDots();
    }
};