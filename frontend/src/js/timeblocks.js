// TimeBlocks Module - Handles time block management
import API from './api.js';
import Utils from './utils.js';
import Settings from './settings.js';
import Dialog from './dialog.js';

class TimeBlocks {
    constructor(projectsInstance) {
        this.projects = projectsInstance;
        this.timeBlocks = [];
        this.currentDate = new Date();
        this.currentEditingId = null;
        this.timer = null; // Will be set by main app
        
        this.initializeElements();
        this.bindEvents();
        this.loadTimeBlocks();
        this.loadProjectsIntoSelector();
    }

    initializeElements() {
        this.timeBlocksList = document.getElementById('time-blocks-list');
        this.addManualBlockBtn = document.getElementById('add-manual-block');
        this.timeBlockModal = document.getElementById('timeblock-modal');
        this.timeBlockModalTitle = document.getElementById('timeblock-modal-title');
        this.timeBlockModalIcon = this.timeBlockModal?.querySelector('.standard-modal-icon');
        this.timeBlockForm = document.getElementById('timeblock-form');
        this.cancelTimeBlockBtn = document.getElementById('cancel-timeblock');
        this.closeTimeBlockBtn = this.timeBlockModal?.querySelector('.standard-modal-close');
        this.currentDateDisplay = document.getElementById('current-date');
        this.prevDayBtn = document.getElementById('prev-day');
        this.nextDayBtn = document.getElementById('next-day');
        
        // Form fields
        this.projectField = document.getElementById('timeblock-project');
        this.startTimeField = document.getElementById('timeblock-start');
        this.endTimeField = document.getElementById('timeblock-end');
        this.descriptionField = document.getElementById('timeblock-description');
    }

    bindEvents() {
        // Date navigation
        this.prevDayBtn?.addEventListener('click', () => this.changeDate(-1));
        this.nextDayBtn?.addEventListener('click', () => this.changeDate(1));
    // Click current date to go to today
    this.currentDateDisplay?.addEventListener('click', () => this.goToToday());
        
        // Manual time block modal
        this.addManualBlockBtn?.addEventListener('click', () => {
            this.currentEditingId = null; // Reset editing ID
            this.openModal('add');
        });
        this.cancelTimeBlockBtn?.addEventListener('click', () => this.closeModal());
        this.closeTimeBlockBtn?.addEventListener('click', () => this.closeModal());
        this.timeBlockForm?.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Close modal when clicking outside
        this.timeBlockModal?.addEventListener('click', (e) => {
            if (e.target === this.timeBlockModal) {
                this.closeModal();
            }
        });

        // Event delegation for action buttons
        this.timeBlocksList?.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.time-block-action-btn');
            if (actionBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const action = actionBtn.dataset.action;
                const id = parseInt(actionBtn.dataset.id);
                
                this.handleTimeBlockAction(action, id);
            }
        });

        // Listen for timer updates
        window.addEventListener('timeBlockUpdated', () => {
            this.loadTimeBlocks();
        });
        
        // Listen for timer state changes (pause/resume)
        window.addEventListener('timerStateChanged', () => {
            this.updateRunningTimers();
        });
        
        // Listen for time format changes
        window.addEventListener('timeFormatChanged', () => {
            this.loadTimeBlocks(); // Reload to update time display
        });

        // Listen for project updates
        window.addEventListener('projectsUpdated', () => {
            this.loadProjectsIntoSelector();
        });

        // Auto-refresh every minute for running timers
        setInterval(() => {
            this.updateRunningTimers();
        }, 60000);
    }

    // Jump to today's date
    goToToday() {
        const today = new Date();
        // Clear time portion to match how dates are compared/loaded
        this.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        this.updateDateDisplay();
        this.loadTimeBlocks();
    }

    // Set timer reference for pause state checking
    setTimer(timer) {
        this.timer = timer;
    }

    async loadProjectsIntoSelector() {
        try {
            const projects = await API.getAllProjects();
            const activeProjects = projects.filter(p => p.status === 'active');
            
            if (this.projectField) {
                // Keep current selection if any
                const currentValue = this.projectField.value;
                
                this.projectField.innerHTML = '<option value="">Select a project...</option>';
                
                activeProjects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    this.projectField.appendChild(option);
                });
                
                // Restore selection if it was previously set and still exists
                if (currentValue && activeProjects.find(p => p.id.toString() === currentValue)) {
                    this.projectField.value = currentValue;
                }
            }
        } catch (error) {
            console.error('Error loading projects into selector:', error);
        }
    }

    changeDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.updateDateDisplay();
        this.loadTimeBlocks();
    }

    updateDateDisplay() {
        if (this.currentDateDisplay) {
            this.currentDateDisplay.textContent = Utils.getRelativeDate(this.currentDate);
        }
    }

    async loadTimeBlocks() {
        try {
            this.timeBlocks = await API.getTimeBlocksByDate(this.currentDate) || [];
            this.renderTimeBlocks();
        } catch (error) {
            console.error('Error loading time blocks:', error);
            Utils.showNotification('Error', 'Failed to load time blocks', 'error');
            this.timeBlocks = [];
            this.renderTimeBlocks();
        }
    }

    renderTimeBlocks() {
        if (!this.timeBlocksList) return;

        if (this.timeBlocks.length === 0) {
            this.timeBlocksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>No Time Blocks Yet</h3>
                    <p>Start the timer or add a manual time block to track your work</p>
                </div>
            `;
            return;
        }

        this.timeBlocksList.innerHTML = this.timeBlocks
            .map(timeBlock => this.createTimeBlockCard(timeBlock))
            .join('');
    }

    createTimeBlockCard(timeBlock) {
        const isRunning = !timeBlock.end_time;
        
        // Check if this time block is paused by checking timer state
        const isTimerPaused = this.timer && this.timer.currentTimeBlockId === timeBlock.id && this.timer.isPaused;
        const isCurrentlyRunning = isRunning && !isTimerPaused;
        
        let duration;
        if (isRunning) {
            if (isTimerPaused && this.timer && this.timer.currentTimeBlockId === timeBlock.id) {
                // Use timer's elapsed seconds when paused
                duration = this.timer.elapsedSeconds;
            } else if (isCurrentlyRunning) {
                // Calculate current duration for running timer
                duration = Utils.calculateDuration(timeBlock.start_time, new Date());
            } else {
                // Fallback calculation
                duration = Utils.calculateDuration(timeBlock.start_time, new Date());
            }
        } else {
            duration = timeBlock.duration;
        }
        
        const timeRange = `${Utils.formatTime(timeBlock.start_time)}${
            timeBlock.end_time ? ` - ${Utils.formatTime(timeBlock.end_time)}` : 
            (isTimerPaused ? ' - Paused' : ' - Running')
        }`;

        return `
            <div class="time-block ${isCurrentlyRunning ? 'running' : ''} ${isTimerPaused ? 'paused' : ''}" data-id="${timeBlock.id}">
                <div class="time-block-info">
                    <div class="time-block-header">
                        <div class="time-block-content">
                            <div class="time-block-project">
                                <i class="fas fa-folder"></i>
                                <span>${Utils.escapeHtml(timeBlock.project_name)}</span>
                            </div>
                            <div class="time-block-duration">
                                <i class="fas fa-clock"></i>
                                <span>${Utils.formatDuration(duration)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="time-block-meta">
                        <div class="time-block-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${timeRange}</span>
                        </div>
                        ${timeBlock.description ? `
                            <div class="time-block-meta-item">
                                <i class="fas fa-sticky-note"></i>
                                <span>${Utils.escapeHtml(timeBlock.description)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="time-block-actions">
                    <button class="time-block-action-btn edit" data-action="edit" data-id="${timeBlock.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="time-block-action-btn delete" data-action="delete" data-id="${timeBlock.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    async handleTimeBlockAction(action, id) {
        try {
            // Ensure id is an integer
            const numericId = parseInt(id);
            if (isNaN(numericId)) {
                throw new Error(`Invalid ID: ${id}`);
            }
            
            switch (action) {
                case 'edit':
                    await this.editTimeBlock(numericId);
                    break;
                case 'delete':
                    await this.deleteTimeBlock(numericId);
                    break;
                default:
                    console.warn('Unknown action:', action);
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            Utils.showNotification('Error', `Failed to ${action} time block: ${error.message}`, 'error');
        }
    }

    async editTimeBlock(id) {
        try {
            const timeBlock = this.timeBlocks.find(tb => tb.id === id);
            
            if (!timeBlock) {
                Utils.showNotification('Error', 'Time block not found', 'error');
                return;
            }

            this.currentEditingId = id;
            
            // Check if form fields exist
            if (!this.projectField || !this.startTimeField || !this.endTimeField || !this.descriptionField) {
                Utils.showNotification('Error', 'Form not properly initialized', 'error');
                return;
            }
            
            // Populate form
            this.projectField.value = timeBlock.project_id;
            this.startTimeField.value = Utils.formatDateTimeForInput(timeBlock.start_time);
            this.endTimeField.value = timeBlock.end_time ? Utils.formatDateTimeForInput(timeBlock.end_time) : '';
            this.descriptionField.value = timeBlock.description || '';
            
            this.openModal('edit');
        } catch (error) {
            console.error('Error editing time block:', error);
            Utils.showNotification('Error', `Failed to edit time block: ${error.message}`, 'error');
        }
    }

    async deleteTimeBlock(id) {
        try {
            // Ensure id is valid
            const numericId = parseInt(id);
            if (isNaN(numericId)) {
                throw new Error(`Invalid time block ID: ${id}`);
            }
            
            try {
                const confirmed = await Dialog.confirm(
                    'Delete Time Block',
                    'Are you sure you want to delete this time block? This action cannot be undone.',
                    {
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        confirmType: 'danger'
                    }
                );
                
                if (!confirmed) {
                    return;
                }
            } catch (dialogError) {
                console.error('Error in Dialog.confirm:', dialogError);
                // Fallback to native confirm
                const confirmed = confirm('Are you sure you want to delete this time block? This action cannot be undone.');
                if (!confirmed) {
                    return;
                }
            }

            const result = await API.deleteTimeBlock(numericId);
            
            // If the deleted time block is the one currently tracked by the timer,
            // reset the timer to avoid leaving it in a running/paused state.
            if (this.timer && this.timer.currentTimeBlockId === numericId) {
                try {
                    this.timer.resetTimer();
                    // ensure any UI depending on timer state updates
                    window.dispatchEvent(new CustomEvent('timerStateChanged', {
                        detail: { isRunning: this.timer.isRunning, isPaused: this.timer.isPaused }
                    }));
                } catch (err) {
                    console.error('Error resetting timer after time block deletion:', err);
                }
            }

            await this.loadTimeBlocks();

            Utils.showNotification('Success', 'Time block deleted successfully!', 'success');

            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('timeBlockUpdated'));
        } catch (error) {
            console.error('Error deleting time block:', error);
            Utils.showNotification('Error', 'Failed to delete time block: ' + error.message, 'error');
        }
    }

    updateRunningTimers() {
        const runningBlocks = this.timeBlocksList?.querySelectorAll('.time-block.running');
        runningBlocks?.forEach(blockElement => {
            const id = parseInt(blockElement.dataset.id);
            const timeBlock = this.timeBlocks.find(tb => tb.id === id);
            
            if (timeBlock && !timeBlock.end_time) {
                // Check if this timer is paused
                const isTimerPaused = this.timer && this.timer.currentTimeBlockId === timeBlock.id && this.timer.isPaused;
                
                let duration;
                if (isTimerPaused) {
                    // Use timer's elapsed seconds when paused (don't calculate from current time)
                    duration = this.timer.elapsedSeconds;
                } else {
                    // Calculate current duration for actually running timer
                    duration = Utils.calculateDuration(timeBlock.start_time, new Date());
                }
                
                const durationElement = blockElement.querySelector('.time-block-duration span');
                if (durationElement) {
                    durationElement.textContent = Utils.formatDuration(duration);
                }
                
                // Update visual state based on pause status
                if (isTimerPaused) {
                    blockElement.classList.remove('running');
                    blockElement.classList.add('paused');
                    
                    // Update time range text
                    const timeRangeElement = blockElement.querySelector('.time-block-meta-item span');
                    if (timeRangeElement) {
                        const startTime = Utils.formatTime(timeBlock.start_time);
                        timeRangeElement.textContent = `${startTime} - Paused`;
                    }
                } else {
                    blockElement.classList.remove('paused');
                    blockElement.classList.add('running');
                    
                    // Update time range text
                    const timeRangeElement = blockElement.querySelector('.time-block-meta-item span');
                    if (timeRangeElement) {
                        const startTime = Utils.formatTime(timeBlock.start_time);
                        timeRangeElement.textContent = `${startTime} - Running`;
                    }
                }
            }
        });
        
        // Also update paused blocks
        const pausedBlocks = this.timeBlocksList?.querySelectorAll('.time-block.paused');
        pausedBlocks?.forEach(blockElement => {
            const id = parseInt(blockElement.dataset.id);
            const timeBlock = this.timeBlocks.find(tb => tb.id === id);
            
            if (timeBlock && !timeBlock.end_time) {
                const isTimerPaused = this.timer && this.timer.currentTimeBlockId === timeBlock.id && this.timer.isPaused;
                
                if (!isTimerPaused) {
                    // Timer is no longer paused, update to running state
                    blockElement.classList.remove('paused');
                    blockElement.classList.add('running');
                    
                    // Update time range text
                    const timeRangeElement = blockElement.querySelector('.time-block-meta-item span');
                    if (timeRangeElement) {
                        const startTime = Utils.formatTime(timeBlock.start_time);
                        timeRangeElement.textContent = `${startTime} - Running`;
                    }
                }
            }
        });
    }

    openModal(mode = 'add') {
        if (!this.timeBlockModal) {
            Utils.showNotification('Error', 'Modal not found', 'error');
            return;
        }
        
        // Update modal title based on mode
        if (this.timeBlockModalTitle) {
            this.timeBlockModalTitle.textContent = mode === 'edit' ? 'Edit Time Block' : 'Add Time Block';
        }
        
        // Update icon based on mode
        if (this.timeBlockModalIcon) {
            if (mode === 'edit') {
                this.timeBlockModalIcon.className = 'standard-modal-icon timeblock-edit';
                const iconElement = this.timeBlockModalIcon.querySelector('i');
                if (iconElement) {
                    iconElement.className = 'fas fa-edit';
                }
            } else {
                this.timeBlockModalIcon.className = 'standard-modal-icon timeblock';
                const iconElement = this.timeBlockModalIcon.querySelector('i');
                if (iconElement) {
                    iconElement.className = 'fas fa-plus-circle';
                }
            }
        }
        
        this.timeBlockModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set default times
        const now = new Date();
        if (!this.currentEditingId) {
            if (this.startTimeField && this.endTimeField) {
                this.startTimeField.value = Utils.formatDateTimeForInput(new Date(now.getTime() - 60 * 60 * 1000)); // 1 hour ago
                this.endTimeField.value = Utils.formatDateTimeForInput(now);
            }
        }
        
        this.projectField?.focus();
    }

    closeModal() {
        this.timeBlockModal?.classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditingId = null;
        
        // Reset form and icon after animation completes
        setTimeout(() => {
            this.timeBlockForm?.reset();
            
            if (this.timeBlockModalIcon) {
                this.timeBlockModalIcon.className = 'standard-modal-icon timeblock';
                const iconElement = this.timeBlockModalIcon.querySelector('i');
                if (iconElement) {
                    iconElement.className = 'fas fa-plus-circle';
                }
            }
        }, 200); // Wait for modal close animation to complete
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this.timeBlockForm);
            
            // Get raw values first
            const projectIdValue = formData.get('project_id');
            const startTimeValue = formData.get('start_time');
            const endTimeValue = formData.get('end_time');
            const descriptionValue = formData.get('description');
            
            const timeBlockData = {
                project_id: parseInt(projectIdValue),
                start_time: new Date(startTimeValue),
                end_time: new Date(endTimeValue),
                description: descriptionValue?.trim() || null
            };

            // Validation
            if (!projectIdValue || projectIdValue === '') {
                Utils.showNotification('Error', 'Please select a project', 'error');
                return;
            }

            if (isNaN(timeBlockData.project_id)) {
                Utils.showNotification('Error', 'Invalid project selected', 'error');
                return;
            }

            if (!startTimeValue || startTimeValue === '') {
                Utils.showNotification('Error', 'Please enter a start time', 'error');
                return;
            }

            if (!endTimeValue || endTimeValue === '') {
                Utils.showNotification('Error', 'Please enter an end time', 'error');
                return;
            }

            if (isNaN(timeBlockData.start_time.getTime())) {
                Utils.showNotification('Error', 'Please enter a valid start time', 'error');
                return;
            }

            if (isNaN(timeBlockData.end_time.getTime())) {
                Utils.showNotification('Error', 'Please enter a valid end time', 'error');
                return;
            }

            if (timeBlockData.start_time >= timeBlockData.end_time) {
                Utils.showNotification('Error', 'End time must be after start time', 'error');
                return;
            }

            // Calculate duration
            timeBlockData.duration = Utils.calculateDuration(timeBlockData.start_time, timeBlockData.end_time);
            timeBlockData.is_manual = true;

            if (this.currentEditingId) {
                // Update existing time block
                await API.updateTimeBlock(this.currentEditingId, {
                    start_time: timeBlockData.start_time,
                    end_time: timeBlockData.end_time,
                    duration: timeBlockData.duration,
                    description: timeBlockData.description
                });
                Utils.showNotification('Success', 'Time block updated successfully!', 'success');
            } else {
                // Create new time block
                const result = await API.createTimeBlock(timeBlockData);
                Utils.showNotification('Success', 'Time block created successfully!', 'success');
            }

            this.closeModal();
            await this.loadTimeBlocks();
            
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('timeBlockUpdated'));
        } catch (error) {
            console.error('Error saving time block:', error);
            Utils.showNotification('Error', `Failed to save time block: ${error.message}`, 'error');
        }
    }

    // Get time blocks for a specific date (used by calendar)
    async getTimeBlocksForDate(date) {
        try {
            return await API.getTimeBlocksByDate(date) || [];
        } catch (error) {
            console.error('Error getting time blocks for date:', error);
            return [];
        }
    }

    // Get current displayed time blocks
    getTimeBlocks() {
        return this.timeBlocks;
    }

    // Set current date and reload
    setCurrentDate(date) {
        this.currentDate = new Date(date);
        this.updateDateDisplay();
        this.loadTimeBlocks();
    }
}

export default TimeBlocks;
