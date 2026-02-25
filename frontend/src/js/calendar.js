
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
        this.timer = null;

        this._tooltipHideTimer = null;

        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {

        if (this.options.containerId) {
            this.calendarContainer = document.getElementById(this.options.containerId);
        } else {
            this.calendarContainer = document.getElementById('calendar-container');
        }
        this.selectedDateDisplay = document.getElementById('selected-calendar-date');
        this.calendarTimeBlocks = document.getElementById('calendar-time-blocks');
        this.addCalendarManualBlockBtn = document.getElementById('add-calendar-manual-block');

        this.selectedDateTotal = document.getElementById('selected-calendar-total');
        if (!this.selectedDateTotal) {
            const header = document.querySelector('#calendar-page .time-blocks-section .section-header');
            if (header) {

                const span = document.createElement('span');
                span.id = 'selected-calendar-total';
                span.className = 'project-total-time calendar';
                span.setAttribute('aria-hidden', 'true');
                span.innerHTML = `<i class="fas fa-clock"></i>`;


                const title = header.querySelector('h2');
                if (title) {
                    const dateSpan = title.querySelector('#selected-calendar-date');


                    const textNodes = Array.from(title.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                    if (textNodes.length > 0) {
                        const textWrap = document.createElement('span');
                        textWrap.className = 'calendar-title-text';
                        textWrap.textContent = textNodes.map(n => n.textContent.trim()).join(' ');
                        title.insertBefore(textWrap, textNodes[0]);
                        textNodes.forEach(n => n.remove());
                    }

                    if (dateSpan) {
                        dateSpan.insertAdjacentElement('afterend', span);
                    } else {
                        title.appendChild(span);
                    }
                } else {

                    if (this.addCalendarManualBlockBtn && this.addCalendarManualBlockBtn.parentNode === header) {
                        header.insertBefore(span, this.addCalendarManualBlockBtn);
                    } else {
                        header.appendChild(span);
                    }
                }
                this.selectedDateTotal = span;
            }
        }
    }

    bindEvents() {

        window.addEventListener('projectsUpdated', () => {
            this.render();
        });


        window.addEventListener('timeBlockUpdated', () => {
            this.loadSelectedDateTimeBlocks();
            this.render();
        });


        window.addEventListener('timerStateChanged', () => {
            this.updateRunningTimers();
        });


        this.addCalendarManualBlockBtn?.addEventListener('click', () => {
            this.openAddTimeBlockModal();
        });


        setInterval(() => {
            this.updateRunningTimers();
        }, 60000);
    }


    setTimer(timer) {
        this.timer = timer;
    }

    async render() {
        if (!this.calendarContainer) return;

        const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);


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


        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

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


                const projectsForDate = this.getProjectsForDate(currentDate);
                const timeBlocksForDate = this.getTimeBlocksForDate(currentDate);


                let projectIndicators = '';

                const dayTooltips = [];


                if (projectsForDate.length > 0) {
                    if (projectsForDate.length <= 3) {

                        projectIndicators += projectsForDate.map(project => {

                            dayTooltips.push(`Deadline: ${project.name}`);
                            return `<div class="calendar-project-dot"></div>`;
                        }).join('');
                    } else {

                        dayTooltips.push(`${projectsForDate.length} project deadlines`);
                        projectIndicators += `<div class="calendar-project-indicator multiple">${projectsForDate.length}</div>`;
                    }
                }


                if (timeBlocksForDate.length > 0) {
                    const blockCount = timeBlocksForDate.length;

                    const totalSeconds = timeBlocksForDate.reduce((sum, block) => {
                        if (block.end_time) {
                            const start = new Date(block.start_time);
                            const end = new Date(block.end_time);
                            return sum + Math.floor((end - start) / 1000);
                        }

                        return sum + (block.duration ? Math.floor(block.duration) : 0);
                    }, 0);

                    const friendly = Utils.formatDurationFriendly(totalSeconds);
                    const tooltipText = blockCount === 1
                        ? `1 time block (${friendly})`
                        : `${blockCount} time blocks (${friendly})`;


                    dayTooltips.push(tooltipText);
                    projectIndicators += `<div class="calendar-project-indicator">${blockCount}</div>`;
                }


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


        const monthYearBtn = this.calendarContainer?.querySelector('#month-year-btn');
        monthYearBtn?.addEventListener('click', () => {
            const today = new Date();

            this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
            this.selectedDate = new Date(today);
            this.render();
        });


        const dayElements = this.calendarContainer?.querySelectorAll('.calendar-day');
        dayElements?.forEach(dayElement => {

            dayElement.addEventListener('mouseenter', (e) => {
                // no-op
            });

            dayElement.addEventListener('mouseleave', (e) => {
                // no-op
            });


        });


        const dayElements2 = this.calendarContainer?.querySelectorAll('.calendar-day');
        dayElements2?.forEach(dayElement => {

            dayElement.addEventListener('click', () => {
                const selected = new Date(dayElement.dataset.date);
                this.selectedDate = selected;

                if (this.isMini) {

                    window.dispatchEvent(new CustomEvent('miniDateSelected', { detail: { date: selected } }));
                } else {
                    this.render();
                    this.loadSelectedDateTimeBlocks();
                }
            });


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

        try {
            if (this.selectedDateTotal) {
                const timeBlocks = this.getTimeBlocksForDate(this.selectedDate) || [];
                const totalSeconds = timeBlocks.reduce((sum, block) => {
                    if (block.end_time) {
                        const start = new Date(block.start_time);
                        const end = new Date(block.end_time);
                        return sum + Math.floor((end - start) / 1000);
                    }

                    return sum + (block.duration ? Math.floor(block.duration) : 0);
                }, 0);


                const totalDisplay = totalSeconds > 0 ? Utils.formatDurationShort(totalSeconds) : '0m';
                if (this.selectedDateTotal) {
                    this.selectedDateTotal.innerHTML = `<i class="fas fa-clock"></i>${totalDisplay}`;
                }
            }
        } catch (err) {
            // ignore
        }
    }

    async loadSelectedDateTimeBlocks() {
        if (!this.calendarTimeBlocks) return;

        try {
            const timeBlocks = await this.timeBlocks.getTimeBlocksForDate(this.selectedDate);





            if (this.isMini) {
                try {
                    this.timeBlocks.timeBlocks = timeBlocks || [];
                    this.timeBlocks.currentDate = new Date(this.selectedDate);
                } catch (syncErr) {

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


            this.bindCalendarTimeBlockEvents();

            this.updateSelectedDateDisplay();

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


        const isTimerPaused = this.timer && this.timer.currentTimeBlockId === timeBlock.id && this.timer.isPaused;
        const isCurrentlyRunning = isRunning && !isTimerPaused;

        let duration;
        if (isRunning) {
            if (isTimerPaused && this.timer && this.timer.currentTimeBlockId === timeBlock.id) {

                duration = this.timer.elapsedSeconds;
            } else if (isCurrentlyRunning) {

                duration = Utils.calculateDuration(timeBlock.start_time, new Date());
            } else {

                duration = Utils.calculateDuration(timeBlock.start_time, new Date());
            }
        } else {
            duration = timeBlock.duration;
        }

        const timeRange = `${Utils.formatTime(timeBlock.start_time)}${timeBlock.end_time ? ` - ${Utils.formatTime(timeBlock.end_time)}` :
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

                    await this.timeBlocks.editTimeBlock(id);
                    break;
                case 'delete':

                    await this.timeBlocks.deleteTimeBlock(id);

                    await this.loadSelectedDateTimeBlocks();

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


            this.timeBlocks.getTimeBlocksForDate(this.selectedDate).then(timeBlocks => {
                const timeBlock = timeBlocks.find(tb => tb.id === id);

                if (timeBlock && !timeBlock.end_time) {

                    const isTimerPaused = this.timer && this.timer.currentTimeBlockId === timeBlock.id && this.timer.isPaused;

                    let duration;
                    if (isTimerPaused) {

                        duration = this.timer.elapsedSeconds;
                    } else {

                        duration = Utils.calculateDuration(timeBlock.start_time, new Date());
                    }

                    const durationElement = blockElement.querySelector('.time-block-duration span');
                    if (durationElement) {
                        durationElement.textContent = Utils.formatDuration(duration);
                    }


                    if (isTimerPaused) {
                        blockElement.classList.remove('running');
                        blockElement.classList.add('paused');


                        const timeRangeElement = blockElement.querySelector('.time-block-meta-item span');
                        if (timeRangeElement) {
                            const startTime = Utils.formatTime(timeBlock.start_time);
                            timeRangeElement.textContent = `${startTime} - Paused`;
                        }
                    } else {
                        blockElement.classList.remove('paused');
                        blockElement.classList.add('running');


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


        const pausedBlocks = this.calendarTimeBlocks?.querySelectorAll('.time-block.paused');
        pausedBlocks?.forEach(blockElement => {
            const id = parseInt(blockElement.dataset.id);


            this.timeBlocks.getTimeBlocksForDate(this.selectedDate).then(timeBlocks => {
                const timeBlock = timeBlocks.find(tb => tb.id === id);

                if (timeBlock && !timeBlock.end_time) {
                    const isTimerPaused = this.timer && this.timer.currentTimeBlockId === timeBlock.id && this.timer.isPaused;

                    if (!isTimerPaused) {

                        blockElement.classList.remove('paused');
                        blockElement.classList.add('running');


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


        const originalDate = this.timeBlocks.currentDate;

        
        this.timeBlocks.currentDate = new Date(this.selectedDate);
        this.timeBlocks.currentEditingId = null;

        
        this.timeBlocks.openModal('add');

        
        setTimeout(() => {
            const startTimeField = document.getElementById('timeblock-start');
            const endTimeField = document.getElementById('timeblock-end');

            if (startTimeField && endTimeField) {
                const selectedDate = new Date(this.selectedDate);
                const startTime = new Date(selectedDate);
                startTime.setHours(new Date().getHours() - 1, 0, 0, 0); 

                const endTime = new Date(selectedDate);
                endTime.setHours(new Date().getHours(), 0, 0, 0); 

                startTimeField.value = Utils.formatDateTimeForInput(startTime);
                endTimeField.value = Utils.formatDateTimeForInput(endTime);
            }

            
            this.timeBlocks.currentDate = originalDate;
        }, 100);
    }

    
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

    
    goToDate(date) {
        this.currentDate = new Date(date);
        this.selectedDate = new Date(date);
        this.render();
    }

    
    getSelectedDate() {
        return this.selectedDate;
    }
}

export default Calendar;
