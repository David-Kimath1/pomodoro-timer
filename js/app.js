// Main Application - Ties everything together

let currentTheme = 'midnight';
let editingTaskId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    const settings = Storage.getSettings();
    currentTheme = settings.theme;
    
    SoundManager.init();
    SoundManager.setVolume(settings.volume);
    
    NotificationManager.requestPermission();
    
    TaskManager.init();
    StatsManager.init();
    Timer.init();
    
    // Apply theme
    applyTheme(currentTheme);
    
    // Setup event listeners
    setupEventListeners();
    
    // Load settings values
    loadSettingsToForm(settings);
    
    // Init pomodoro count display
    initPomodoroCount();
});

// Adjust timer by seconds
function adjustTimer(seconds) {
    Timer.remaining = Math.max(0, Math.min(Timer.remaining + seconds, Timer.duration + 600));
    Timer.updateDisplay();
}

// Adjust settings time values
function adjustTime(id, change) {
    const input = document.getElementById(id);
    if (!input) return;
    
    let value = parseInt(input.value) || 0;
    value = Math.max(1, Math.min(value + change, 120));
    input.value = value;
}

// Change pomodoro count in task modal
function changePomodoroCount(change) {
    const input = document.getElementById('taskPomodoros');
    const display = document.getElementById('pomodoroCountDisplay');
    
    if (!input || !display) return;
    
    let value = parseInt(input.value) || 1;
    value = Math.max(1, Math.min(value + change, 20));
    input.value = value;
    display.textContent = value;
}

// Initialize pomodoro count display
function initPomodoroCount() {
    const display = document.getElementById('pomodoroCountDisplay');
    const input = document.getElementById('taskPomodoros');
    if (display && input) {
        display.textContent = input.value || 4;
    }
}

function applyTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const colors = {
        midnight: '#1a1a2e',
        forest: '#1a2e1a',
        ocean: '#1a2a3e',
        sunset: '#2e1a1a',
        matcha: '#1e2e1a',
        lavender: '#2a1a3e'
    };
    if (metaTheme && colors[theme]) {
        metaTheme.setAttribute('content', colors[theme]);
    }
}

function loadSettingsToForm(settings) {
    document.getElementById('focusDuration').value = settings.focusDuration;
    document.getElementById('shortBreakDuration').value = settings.shortBreakDuration;
    document.getElementById('longBreakDuration').value = settings.longBreakDuration;
    document.getElementById('longBreakInterval').value = settings.longBreakInterval;
    document.getElementById('dailyGoal').value = settings.dailyGoal;
    document.getElementById('autoStartBreaks').checked = settings.autoStartBreaks;
    document.getElementById('autoStartFocus').checked = settings.autoStartFocus;
    document.getElementById('alertSound').value = settings.alertSound;
    document.getElementById('volumeSlider').value = settings.volume;
    
    // Update theme dots in settings
    document.querySelectorAll('#themeOptions .theme-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.theme === settings.theme);
    });
    
    // Update timer labels
    document.getElementById('focusTimeLabel').textContent = `${settings.focusDuration}:00`;
    document.getElementById('shortBreakTimeLabel').textContent = `${settings.shortBreakDuration}:00`;
    document.getElementById('longBreakTimeLabel').textContent = `${settings.longBreakDuration}:00`;
}

function saveSettings() {
    const settings = {
        focusDuration: parseInt(document.getElementById('focusDuration').value) || 25,
        shortBreakDuration: parseInt(document.getElementById('shortBreakDuration').value) || 5,
        longBreakDuration: parseInt(document.getElementById('longBreakDuration').value) || 15,
        longBreakInterval: parseInt(document.getElementById('longBreakInterval').value) || 4,
        dailyGoal: parseInt(document.getElementById('dailyGoal').value) || 6,
        autoStartBreaks: document.getElementById('autoStartBreaks').checked,
        autoStartFocus: document.getElementById('autoStartFocus').checked,
        alertSound: document.getElementById('alertSound').value,
        theme: currentTheme,
        volume: parseInt(document.getElementById('volumeSlider').value) || 50
    };
    
    Storage.saveSettings(settings);
    Timer.updateSettings(settings);
    SoundManager.setVolume(settings.volume);
    applyTheme(settings.theme);
    
    showToast('Settings saved');
    document.getElementById('settingsModal').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    const msg = document.getElementById('toastMessage');
    
    msg.textContent = message;
    icon.className = type === 'error' ? 'fa-solid fa-exclamation-circle' : 'fa-solid fa-check-circle';
    toast.style.background = type === 'error' ? 'var(--danger)' : 'var(--success)';
    
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}

// Setup theme listeners separately for clarity
function setupThemeListeners() {
    // Settings modal theme dots
    const themeOptions = document.getElementById('themeOptions');
    if (themeOptions) {
        themeOptions.addEventListener('click', (e) => {
            const dot = e.target.closest('.theme-dot');
            if (!dot) return;
            
            currentTheme = dot.dataset.theme;
            applyTheme(currentTheme);
            
            // Update active state
            document.querySelectorAll('#themeOptions .theme-dot').forEach(b => {
                b.classList.toggle('active', b.dataset.theme === currentTheme);
            });
        });
    }
    
    // Theme modal cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            currentTheme = card.dataset.theme;
            applyTheme(currentTheme);
            document.getElementById('themeModal').classList.add('hidden');
            
            // Sync settings dots
            document.querySelectorAll('#themeOptions .theme-dot').forEach(dot => {
                dot.classList.toggle('active', dot.dataset.theme === currentTheme);
            });
            
            showToast(`Theme: ${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}`);
        });
    });
}

function setupEventListeners() {
    // Timer controls
    document.getElementById('playBtn').addEventListener('click', () => Timer.start());
    document.getElementById('skipBtn').addEventListener('click', () => Timer.skip());
    document.getElementById('resetBtn').addEventListener('click', () => Timer.reset());
    
    // Session tabs
    document.querySelectorAll('.session-tab').forEach(tab => {
        tab.addEventListener('click', () => Timer.switchMode(tab.dataset.mode));
    });
    
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => {
        const settings = Storage.getSettings();
        currentTheme = settings.theme;
        loadSettingsToForm(settings);
        document.getElementById('settingsModal').classList.remove('hidden');
    });
    
    document.getElementById('closeSettingsModal').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('hidden');
    });
    
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Setup theme listeners
    setupThemeListeners();
    
    // Theme modal
    document.getElementById('themeBtn').addEventListener('click', () => {
        document.getElementById('themeModal').classList.remove('hidden');
    });
    
    document.getElementById('closeThemeModal').addEventListener('click', () => {
        document.getElementById('themeModal').classList.add('hidden');
    });
    
    // Stats
    document.getElementById('statsBtn').addEventListener('click', () => {
        StatsManager.render();
        document.getElementById('statsModal').classList.remove('hidden');
    });
    
    document.getElementById('closeStatsModal').addEventListener('click', () => {
        document.getElementById('statsModal').classList.add('hidden');
    });
    
    // Tasks
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        editingTaskId = null;
        document.getElementById('taskModalTitle').textContent = 'Add Task';
        document.getElementById('taskName').value = '';
        document.getElementById('taskCategory').value = 'work';
        document.getElementById('taskPomodoros').value = '4';
        document.getElementById('taskId').value = '';
        initPomodoroCount();
        document.getElementById('taskModal').classList.remove('hidden');
    });
    
    document.getElementById('closeTaskModal').addEventListener('click', () => {
        document.getElementById('taskModal').classList.add('hidden');
    });
    
    document.getElementById('cancelTaskBtn').addEventListener('click', () => {
        document.getElementById('taskModal').classList.add('hidden');
    });
    
    document.getElementById('saveTaskBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const name = document.getElementById('taskName').value.trim();
        const category = document.getElementById('taskCategory').value;
        const pomodoros = parseInt(document.getElementById('taskPomodoros').value) || 4;
        
        if (!name) {
            showToast('Please enter a task name', 'error');
            return;
        }
        
        if (editingTaskId) {
            TaskManager.update(editingTaskId, { name, category, estimatedPomodoros: pomodoros });
        } else {
            TaskManager.add(name, category, pomodoros);
        }
        
        document.getElementById('taskModal').classList.add('hidden');
        showToast(editingTaskId ? 'Task updated' : 'Task added');
        editingTaskId = null;
    });
    
    // Volume slider
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        SoundManager.setVolume(parseInt(e.target.value));
    });
    
    // Sound buttons
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const sound = btn.dataset.sound;
            if (sound === 'none') {
                SoundManager.stopAmbient();
            } else {
                SoundManager.startAmbient(sound);
            }
        });
    });
    
    // Data management
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        const data = Storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pomodoro-data-${Storage.getTodayDate()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported');
    });
    
    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    
    document.getElementById('importFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    Storage.importData(data);
                    
                    const settings = Storage.getSettings();
                    currentTheme = settings.theme;
                    Timer.updateSettings(settings);
                    SoundManager.setVolume(settings.volume);
                    applyTheme(settings.theme);
                    TaskManager.init();
                    StatsManager.init();
                    
                    showToast('Data imported');
                    document.getElementById('settingsModal').classList.add('hidden');
                } catch (err) {
                    showToast('Invalid file', 'error');
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    });
    
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('Delete all data? This cannot be undone.')) {
            Storage.clearAll();
            Timer.init();
            TaskManager.tasks = [];
            TaskManager.render();
            StatsManager.init();
            showToast('All data cleared');
            document.getElementById('settingsModal').classList.add('hidden');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                Timer.isRunning ? Timer.pause() : Timer.start();
                break;
            case 'ArrowRight':
                Timer.skip();
                break;
            case 'ArrowLeft':
                Timer.reset();
                break;
            case 'Digit1':
                Timer.switchMode('focus');
                break;
            case 'Digit2':
                Timer.switchMode('shortBreak');
                break;
            case 'Digit3':
                Timer.switchMode('longBreak');
                break;
        }
    });
    
    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    });
}