// Tasks Module - Handles task management

const TaskManager = {
    tasks: [],
    activeTaskId: null,

    init() {
        this.tasks = Storage.getTasks();
        this.render();
    },

    // Add a new task
    add(name, category, estimatedPomodoros) {
        const task = {
            id: Date.now(),
            name,
            category: category || 'other',
            estimatedPomodoros: estimatedPomodoros || 4,
            completedPomodoros: 0,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.save();
        this.render();
        return task;
    },

    // Update a task
    update(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            this.save();
            this.render();
        }
    },

    // Delete a task
    delete(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        if (this.activeTaskId === id) {
            this.activeTaskId = null;
        }
        this.save();
        this.render();
    },

    // Toggle task completion
    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.save();
            this.render();
        }
    },

    // Set active task
    setActive(id) {
        this.activeTaskId = id;
        this.render();
    },

    // Get active task
    getActive() {
        return this.tasks.find(t => t.id === this.activeTaskId) || null;
    },

    // Increment pomodoro count for active task
    incrementPomodoro() {
        const task = this.getActive();
        if (task) {
            task.completedPomodoros++;
            if (task.completedPomodoros >= task.estimatedPomodoros) {
                task.completed = true;
            }
            
            // Update stats
            const stats = Storage.getStats();
            if (!stats.taskBreakdown[task.category]) {
                stats.taskBreakdown[task.category] = 0;
            }
            stats.taskBreakdown[task.category]++;
            Storage.saveStats(stats);
            
            this.save();
            this.render();
        }
    },

    // Save tasks
    save() {
        Storage.saveTasks(this.tasks);
    },

    // Render task list
    render() {
        const taskList = document.getElementById('taskList');
        const taskEmptyState = document.getElementById('taskEmptyState');
        const activeTaskCard = document.getElementById('activeTaskCard');
        const activeTaskName = document.getElementById('activeTaskName');
        const activeTaskPomodoros = document.getElementById('activeTaskPomodoros');
        
        // Update active task display
        const activeTask = this.getActive();
        if (activeTask) {
            activeTaskName.textContent = activeTask.name;
            activeTaskPomodoros.textContent = `${activeTask.completedPomodoros}/${activeTask.estimatedPomodoros}`;
            activeTaskCard.style.display = '';
        } else {
            activeTaskCard.style.display = 'none';
        }
        
        // Filter out completed tasks for display
        const displayTasks = this.tasks.filter(t => !t.completed).slice(0, 10);
        
        if (displayTasks.length === 0) {
            taskList.innerHTML = '';
            taskList.appendChild(taskEmptyState);
            taskEmptyState.classList.remove('hidden');
            return;
        }
        
        taskEmptyState.classList.add('hidden');
        
        taskList.innerHTML = displayTasks.map(task => `
            <div class="task-item ${task.id === this.activeTaskId ? 'active-task' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'done' : ''}" onclick="TaskManager.toggleComplete(${task.id})">
                    ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
                </div>
                <div class="task-content" onclick="TaskManager.setActive(${task.id})">
                    <div class="task-item-name">${this.escapeHtml(task.name)}</div>
                    <div class="task-item-meta">
                        ${task.category} · ${task.completedPomodoros}/${task.estimatedPomodoros} pomodoros
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="TaskManager.setActive(${task.id})" title="Set as active">
                        <i class="fa-solid fa-play"></i>
                    </button>
                    <button class="task-action-btn delete" onclick="TaskManager.delete(${task.id})" title="Delete task">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};