// Calendar Module - Handles calendar functionality
import API from './api.js';
import Utils from './utils.js';

class Calendar {
    constructor(projectsInstance, timeBlocksInstance, options = {}) {
        this.projects = projectsInstance;
        this.timeBlocks = timeBlocksInstance;
        this.options = options || {};
        this.isMini = !!this.options.mini;
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.monthTimeBlocks = [];
        this.timer = null; // Will be set by main app
    // Debounce timer id for hiding tooltips in calendar to avoid flicker
    this._tooltipHideTimer = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        // Allow overriding the container for mini calendar instances
        if (this.options.containerId) {
            this.calendarContainer = document.getElementById(this.options.containerId);
        } else {
            this.calendarContainer = document.getElementById('calendar-container');
        }
        this.selectedDateDisplay = document.getElementById('selected-calendar-date');
        this.calendarTimeBlocks = document.getElementById('calendar-time-blocks');
        this.addCalendarManualBlockBtn = document.getElementById('add-calendar-manual-block');
    }

    bindEvents() {
        // Listen for project updates
        window.addEventListener('projectsUpdated', () => {
            this.render();
        });

        // Listen for time block updates
        window.addEventListener('timeBlockUpdated', () => {
            this.loadSelectedDateTimeBlocks();
            this.render(); // Update calendar indicators
        });

        // Listen for timer state changes (pause/resume)
        window.addEventListener('timerStateChanged', () => {
            this.updateRunningTimers();
        });

        // Add manual time block button
        this.addCalendarManualBlockBtn?.addEventListener('click', () => {
            this.openAddTimeBlockModal();
        });

        // Auto-refresh running timers every minute
        setInterval(() => {
            this.updateRunningTimers();
        }, 60000);
    }

    // Set timer reference for pause state checking
    setTimer(timer) {
        this.timer = timer;
    }

    async render() {
        if (!this.calendarContainer) return;

        const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        // Load time blocks for the entire month
        try {
            this.monthTimeBlocks = await API.getTimeBlocksByDateRange(startOfMonth, endOfMonth) || [];
        } catch (error) {
            console.error('Error loading month time blocks:', error);
            this.monthTimeBlocks = [];
        }

        this.calendarContainer.innerHTML = this.createCalendarHTML();
        this.bindCalendarEvents();
        this.updateSelectedDateDisplay();
        this.loadSelectedDateTimeBlocks();
    }

    createCalendarHTML() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        
        // Calculate calendar grid
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
        
        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        let html = `
            <div class="calendar-header">
                <h2 class="calendar-title">
                    <i class="fas fa-calendar-alt"></i>
                    <button id="month-year-btn" class="calendar-month-btn" type="button" data-tooltip="Go to current month" data-tooltip-position="top">${monthName}</button>
                </h2>
                <div class="calendar-nav">
                    <button class="calendar-nav-btn" id="prev-month">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="calendar-nav-btn" id="next-month">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    </button>
                </div>
            </div>
            
            <div class="calendar-grid">
                <!-- Day headers -->
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>
        `;
        
        // Generate calendar days
        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = Utils.getStartOfDay(currentDate).getTime() === Utils.getStartOfDay(today).getTime();
                const isSelected = Utils.getStartOfDay(currentDate).getTime() === Utils.getStartOfDay(this.selectedDate).getTime();
                
                const dayClasses = [
                    'calendar-day',
                    !isCurrentMonth ? 'other-month' : '',
                    isToday ? 'today' : '',
                    isSelected ? 'selected' : ''
                ].filter(Boolean).join(' ');
                
                // Get projects with deadlines for this date
                const projectsForDate = this.getProjectsForDate(currentDate);
                const timeBlocksForDate = this.getTimeBlocksForDate(currentDate);
                
                // Create modern indicators
                let projectIndicators = '';
                // Aggregate tooltip texts for the whole day container
                const dayTooltips = [];
                
                // Add deadline indicators (project dots)
                if (projectsForDate.length > 0) {
                    if (projectsForDate.length <= 3) {
                        // Show individual dots for few projects
                        projectIndicators += projectsForDate.map(project => {
                            // add to day-level tooltip list
                            dayTooltips.push(`Deadline: ${project.name}`);
                            return `<div class="calendar-project-dot"></div>`;
                        }).join('');
                    } else {
                        // Show count indicator for many projects
                        dayTooltips.push(`${projectsForDate.length} project deadlines`);
                        projectIndicators += `<div class="calendar-project-indicator multiple">${projectsForDate.length}</div>`;
                    }
                }
                
                // Add time blocks indicator
                if (timeBlocksForDate.length > 0) {
                    const blockCount = timeBlocksForDate.length;
                    const totalHours = timeBlocksForDate.reduce((sum, block) => {
                        if (block.end_time) {
                            const start = new Date(block.start_time);
                            const end = new Date(block.end_time);
                            return sum + (end - start) / (1000 * 60 * 60); // Convert to hours
                        }
                        return sum;
                    }, 0);
                    
                    const tooltipText = blockCount === 1 
                        ? `1 time block (${totalHours.toFixed(1)}h)`
                        : `${blockCount} time blocks (${totalHours.toFixed(1)}h)`;
                    
                    // add time block tooltip summary to day-level tooltips
                    dayTooltips.push(tooltipText);
                    projectIndicators += `<div class="calendar-project-indicator">${blockCount}</div>`;
                }

                // If we have aggregated tooltips, create an invisible overlay element that carries the tooltip
                const dayTooltip = dayTooltips.length > 0 ? dayTooltips.map(t => t.replace(/"/g, '\\"')).join('\n') : null;
                const overlayHtml = dayTooltip ? `<div class="calendar-day-overlay" data-tooltip="${dayTooltip}" data-tooltip-position="top"></div>` : '';

                html += `
                    <div class="${dayClasses}" data-date="${currentDate.toISOString()}">
                        <div class="calendar-day-number">${currentDate.getDate()}</div>
                        ${overlayHtml}
                        <div class="calendar-day-projects">
                            ${projectIndicators}
                        </div>
                    </div>
                `;
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        html += '</div>';
        return html;
    }

    bindCalendarEvents() {
        // Month navigation
        const prevBtn = this.calendarContainer?.querySelector('#prev-month');
        const nextBtn = this.calendarContainer?.querySelector('#next-month');
        
        prevBtn?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });
        
        nextBtn?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });

        // Clickable month/year title -> go to current month
        const monthYearBtn = this.calendarContainer?.querySelector('#month-year-btn');
        monthYearBtn?.addEventListener('click', () => {
            const today = new Date();
            // Navigate calendar to current month and select today
            this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
            this.selectedDate = new Date(today);
            this.render();
        });
        
        // Day selection
        const dayElements = this.calendarContainer?.querySelectorAll('.calendar-day');
        dayElements?.forEach(dayElement => {
            // No tooltip handling here; a dedicated overlay element will carry tooltip activation to avoid flicker
            dayElement.addEventListener('mouseenter', (e) => {
                // no-op
            });

            dayElement.addEventListener('mouseleave', (e) => {
                // no-op
            });

            // (No contextmenu handler) right-click will not trigger the tooltip for calendar days
        });

        // For each day element, show/hide tooltip by reading the overlay inside it and allow clicks on the day
        const dayElements2 = this.calendarContainer?.querySelectorAll('.calendar-day');
        dayElements2?.forEach(dayElement => {
            // Click selects the day for all days (even those without events)
            dayElement.addEventListener('click', () => {
                const selected = new Date(dayElement.dataset.date);
                this.selectedDate = selected;

                if (this.isMini) {
                    // Emit event for mini calendar usage and don't re-render full calendar
                    window.dispatchEvent(new CustomEvent('miniDateSelected', { detail: { date: selected } }));
                } else {
                    this.render();
                    this.loadSelectedDateTimeBlocks();
                }
            });

            // Hover logic: if an overlay with tooltip exists inside the day, show/hide it
            dayElement.addEventListener('mouseenter', (e) => {
                try {
                    const overlay = dayElement.querySelector('.calendar-day-overlay');
                    if (overlay) {
                        window.tooltipManager?.show(overlay);
                    }
                } catch (err) {
                    // ignore
                }
            });

            dayElement.addEventListener('mouseleave', (e) => {
                try {
                    const overlay = dayElement.querySelector('.calendar-day-overlay');
                    if (overlay) {
                        window.tooltipManager?.hide();
                    }
                } catch (err) {
                    // ignore
                }
            });
        });
    }

    getProjectsForDate(date) {
        const projects = this.projects.getProjects();
        const targetDate = Utils.getStartOfDay(date);
        
        return projects.filter(project => {
            if (!project.deadline) return false;
            const deadlineDate = Utils.getStartOfDay(new Date(project.deadline));
            return deadlineDate.getTime() === targetDate.getTime();
        });
    }

    getTimeBlocksForDate(date) {
        const targetDate = Utils.getStartOfDay(date);
        
        return this.monthTimeBlocks.filter(timeBlock => {
            const timeBlockDate = Utils.getStartOfDay(new Date(timeBlock.start_time));
            return timeBlockDate.getTime() === targetDate.getTime();
        });
    }

    updateSelectedDateDisplay() {
        if (this.selectedDateDisplay) {
            this.selectedDateDisplay.textContent = Utils.formatDate(this.selectedDate);
        }
    }

    async loadSelectedDateTimeBlocks() {
        if (!this.calendarTimeBlocks) return;

        try {
            const timeBlocks = await this.timeBlocks.getTimeBlocksForDate(this.selectedDate);

            // Only sync the TimeBlocks instance when this calendar is the mini
            // calendar used elsewhere (e.g., header mini calendar). The full
            // calendar view must not override the Home TimeBlocks currentDate
            // because that leads to unexpected navigation/state changes.
            if (this.isMini) {
                try {
                    this.timeBlocks.timeBlocks = timeBlocks || [];
                    this.timeBlocks.currentDate = new Date(this.selectedDate);
                } catch (syncErr) {
                    // Non-fatal: if sync fails, continue rendering calendar's own list
                    console.warn('Failed to sync TimeBlocks instance from Calendar (mini):', syncErr);
                }
            }
            
            if (timeBlocks.length === 0) {
                this.calendarTimeBlocks.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clock"></i>
                        <h3>No Time Blocks</h3>
                        <p>No work was tracked on this date</p>
                    </div>
                `;
                return;
            }

            this.calendarTimeBlocks.innerHTML = timeBlocks
                .map(timeBlock => this.createTimeBlockCard(timeBlock))
                .join('');
                
            // Bind events for the time block actions
            this.bindCalendarTimeBlockEvents();
                
        } catch (error) {
            console.error('Error loading calendar time blocks:', error);
            this.calendarTimeBlocks.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Data</h3>
                    <p>Failed to load time blocks for this date</p>
                </div>
            `;
        }
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
                    <button class="time-block-action-btn edit" data-action="edit" data-id="${timeBlock.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="time-block-action-btn delete" data-action="delete" data-id="${timeBlock.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    bindCalendarTimeBlockEvents() {
        if (!this.calendarTimeBlocks) return;

        // Event delegation for action buttons
        const actionButtons = this.calendarTimeBlocks.querySelectorAll('.time-block-action-btn');
        
        actionButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);
                
                await this.handleCalendarTimeBlockAction(action, id);
            });
        });
    }

    async handleCalendarTimeBlockAction(action, id) {
        try {
            switch (action) {
                case 'edit':
                    // Open the time block edit modal
                    await this.timeBlocks.editTimeBlock(id);
                    break;
                case 'delete':
                    // Delete the time block
                    await this.timeBlocks.deleteTimeBlock(id);
                    // Reload calendar time blocks after deletion
                    await this.loadSelectedDateTimeBlocks();
                    // Reload the calendar to update indicators
                    await this.render();
                    break;
                default:
                    console.warn('Unknown action:', action);
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            Utils.showNotification('Error', `Failed to ${action} time block`, 'error');
        }
    }

    updateRunningTimers() {
        if (!this.calendarTimeBlocks) return;
        
        const runningBlocks = this.calendarTimeBlocks.querySelectorAll('.time-block.running');
        runningBlocks?.forEach(blockElement => {
            const id = parseInt(blockElement.dataset.id);
            
            // Find the time block in the current data
            this.timeBlocks.getTimeBlocksForDate(this.selectedDate).then(timeBlocks => {
                const timeBlock = timeBlocks.find(tb => tb.id === id);
                
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
            }).catch(error => {
                console.error('Error updating running timer:', error);
            });
        });
        
        // Also update paused blocks
        const pausedBlocks = this.calendarTimeBlocks?.querySelectorAll('.time-block.paused');
        pausedBlocks?.forEach(blockElement => {
            const id = parseInt(blockElement.dataset.id);
            
            // Find the time block in the current data
            this.timeBlocks.getTimeBlocksForDate(this.selectedDate).then(timeBlocks => {
                const timeBlock = timeBlocks.find(tb => tb.id === id);
                
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
            }).catch(error => {
                console.error('Error updating paused timer:', error);
            });
        });
    }

    openAddTimeBlockModal() {
        // Open the standard timeblock modal but with calendar's selected date
        // Don't modify the timeBlocks instance date - just use it temporarily
        const originalDate = this.timeBlocks.currentDate;
        
        // Temporarily set the date for the modal
        this.timeBlocks.currentDate = new Date(this.selectedDate);
        this.timeBlocks.currentEditingId = null;
        
        // Open the timeblock modal with the selected date context
        this.timeBlocks.openModal('add');
        
        // Set default times for the selected date
        setTimeout(() => {
            const startTimeField = document.getElementById('timeblock-start');
            const endTimeField = document.getElementById('timeblock-end');
            
            if (startTimeField && endTimeField) {
                const selectedDate = new Date(this.selectedDate);
                const startTime = new Date(selectedDate);
                startTime.setHours(new Date().getHours() - 1, 0, 0, 0); // 1 hour ago
                
                const endTime = new Date(selectedDate);
                endTime.setHours(new Date().getHours(), 0, 0, 0); // Current hour
                
                startTimeField.value = Utils.formatDateTimeForInput(startTime);
                endTimeField.value = Utils.formatDateTimeForInput(endTime);
            }
            
            // Restore original date after modal setup
            this.timeBlocks.currentDate = originalDate;
        }, 100);
    }

    // Get summary data for the current month
    getMonthSummary() {
        const totalTime = this.monthTimeBlocks.reduce((total, timeBlock) => {
            return total + (timeBlock.duration || 0);
        }, 0);

        const projectSummary = {};
        this.monthTimeBlocks.forEach(timeBlock => {
            if (!projectSummary[timeBlock.project_name]) {
                projectSummary[timeBlock.project_name] = 0;
            }
            projectSummary[timeBlock.project_name] += timeBlock.duration || 0;
        });

        return {
            totalTime,
            projectSummary,
            totalDays: Object.keys(this.groupTimeBlocksByDate()).length
        };
    }

    groupTimeBlocksByDate() {
        const grouped = {};
        this.monthTimeBlocks.forEach(timeBlock => {
            const date = Utils.formatDateForInput(timeBlock.start_time);
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(timeBlock);
        });
        return grouped;
    }

    // Navigate to specific date
    goToDate(date) {
        this.currentDate = new Date(date);
        this.selectedDate = new Date(date);
        this.render();
    }

    // Get current selected date
    getSelectedDate() {
        return this.selectedDate;
    }
}

export default Calendar;
