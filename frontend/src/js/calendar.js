// Calendar Module - Handles calendar functionality
import API from './api.js';
import Utils from './utils.js';

class Calendar {
    constructor(projectsInstance, timeBlocksInstance) {
        this.projects = projectsInstance;
        this.timeBlocks = timeBlocksInstance;
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.monthTimeBlocks = [];
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.calendarContainer = document.getElementById('calendar-container');
        this.selectedDateDisplay = document.getElementById('selected-calendar-date');
        this.calendarTimeBlocks = document.getElementById('calendar-time-blocks');
    }

    bindEvents() {
        // Listen for project updates
        window.addEventListener('projectsUpdated', () => {
            this.render();
        });
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
                <h2 class="calendar-title">${monthName}</h2>
                <div class="calendar-nav">
                    <button class="calendar-nav-btn" id="prev-month">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="calendar-nav-btn" id="next-month">
                        <i class="fas fa-chevron-right"></i>
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
                
                html += `
                    <div class="${dayClasses}" data-date="${currentDate.toISOString()}">
                        <div class="calendar-day-number">${currentDate.getDate()}</div>
                        <div class="calendar-day-projects">
                            ${projectsForDate.map(project => 
                                `<div class="calendar-project-indicator" title="Deadline: ${project.name}"></div>`
                            ).join('')}
                            ${timeBlocksForDate.length > 0 ? 
                                `<div class="calendar-project-indicator" style="background-color: var(--success-color);" title="${timeBlocksForDate.length} time block(s)"></div>`
                            : ''}
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
        
        // Day selection
        const dayElements = this.calendarContainer?.querySelectorAll('.calendar-day');
        dayElements?.forEach(dayElement => {
            dayElement.addEventListener('click', () => {
                this.selectedDate = new Date(dayElement.dataset.date);
                this.render();
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
        const duration = isRunning ? 
            Utils.calculateDuration(timeBlock.start_time, new Date()) : 
            timeBlock.duration;
        
        const timeRange = `${Utils.formatTime(timeBlock.start_time)}${
            timeBlock.end_time ? ` - ${Utils.formatTime(timeBlock.end_time)}` : ' - Running'
        }`;

        return `
            <div class="time-block ${isRunning ? 'running' : ''}" data-id="${timeBlock.id}">
                <div class="time-block-info">
                    <div class="time-block-project">${Utils.escapeHtml(timeBlock.project_name)}</div>
                    <div class="time-block-duration">${Utils.formatDuration(duration)}</div>
                    <div class="time-block-time">${timeRange}</div>
                    ${timeBlock.description ? `
                        <div class="time-block-description">${Utils.escapeHtml(timeBlock.description)}</div>
                    ` : ''}
                </div>
            </div>
        `;
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
