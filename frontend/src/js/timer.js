// Timer Module - Handles timer functionality
import API from './api.js';
import Utils from './utils.js';

class Timer {
    constructor() {
        console.log('Timer constructor called');
        this.isRunning = false;
        this.isPaused = false;
        this.currentProjectId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.totalPausedTime = 0; // Track total time spent paused
        this.pauseStartTime = null; // When the current pause started
        this.currentTimeBlockId = null;
        this.interval = null;
        this.elapsedSeconds = 0;

        // Wait a bit to ensure DOM is ready
        setTimeout(() => {
            this.initializeElements();
            this.bindEvents();
            this.updateDisplay();
            console.log('Timer initialized successfully');
        }, 100);
    }

    initializeElements() {
        console.log('Initializing timer elements...');
        this.projectSelector = document.getElementById('project-selector');
    this.openProjectDiscordBtn = document.getElementById('open-project-discord');
    this.openProjectUrlBtn = document.getElementById('open-project-url');
    this.openProjectDirBtn = document.getElementById('open-project-dir');
    this.editProjectBtn = document.getElementById('edit-project-btn');
        this.timerDisplay = document.getElementById('timer-display');
        this.startBtn = document.getElementById('start-timer');
        this.pauseBtn = document.getElementById('pause-timer');
        this.stopBtn = document.getElementById('stop-timer');
        this.resetBtn = document.getElementById('reset-timer');
        this.timerContainer = document.querySelector('.timer-section');
        
        console.log('Elements found:', {
            projectSelector: !!this.projectSelector,
            timerDisplay: !!this.timerDisplay,
            startBtn: !!this.startBtn,
            pauseBtn: !!this.pauseBtn,
            stopBtn: !!this.stopBtn,
            resetBtn: !!this.resetBtn,
            timerContainer: !!this.timerContainer
        });
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.resetBtn.addEventListener('click', () => this.reset());
        // When project selection changes, update the project-URL button visibility
        if (this.projectSelector) {
            this.projectSelector.addEventListener('change', () => this.updateProjectUrlButton());
        }

        // Open project URL when the button is clicked
        if (this.openProjectUrlBtn) {
            this.openProjectUrlBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.openSelectedProjectUrl();
            });
        }

        // Open project discord when the button is clicked
        if (this.openProjectDiscordBtn) {
            this.openProjectDiscordBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.openSelectedProjectDiscord();
            });
        }

        // Open project directory when the button is clicked
        if (this.openProjectDirBtn) {
            this.openProjectDirBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.openSelectedProjectDir();
            });
        }

        // Edit selected project when edit button is clicked
        if (this.editProjectBtn) {
            this.editProjectBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.editSelectedProject();
            });
        }

        // Listen for project list updates so option data-urls are available/updated
        window.addEventListener('projectsUpdated', () => this.updateProjectUrlButton());
    }

    async openSelectedProjectDiscord() {
        try {
            if (!this.projectSelector || !this.projectSelector.value) return;

            const selectedOption = this.projectSelector.options[this.projectSelector.selectedIndex];
            let discordRaw = selectedOption?.dataset?.discord || null;

            // Fallback: ask API for project details
            if (!discordRaw) {
                try {
                    const projectId = parseInt(this.projectSelector.value);
                    const proj = await API.getProjectByID(projectId);
                    discordRaw = proj?.discord || null;
                } catch (err) {
                    console.error('Error fetching project for discord:', err);
                }
            }

            if (!discordRaw) {
                Utils.showNotification('Warning', 'No Discord channel set for selected project', 'warning');
                return;
            }

            // parse and build protocol URL
            const discordRegex = /(?:discord:\/\/-\/channels\/|https?:\/\/[^\s\/]+\/channels\/)(\d+)\/(\d+)/i;
            const m = String(discordRaw).match(discordRegex);
            let protocolURL = null;
            if (m && m.length >= 3) {
                const serverId = m[1];
                const channelId = m[2];
                protocolURL = `discord://-/channels/${serverId}/${channelId}`;
            } else {
                const parts = String(discordRaw).split('/').filter(Boolean);
                if (parts.length >= 2 && /^\d+$/.test(parts[parts.length-2]) && /^\d+$/.test(parts[parts.length-1])) {
                    const serverId = parts[parts.length-2];
                    const channelId = parts[parts.length-1];
                    protocolURL = `discord://-/channels/${serverId}/${channelId}`;
                }
            }

            if (!protocolURL) {
                Utils.showNotification('Error', 'Could not parse Discord channel URL for selected project', 'error');
                return;
            }

            // Try backend OpenURL first
            try {
                if (window.go && window.go.main && window.go.main.App && typeof window.go.main.App.OpenURL === 'function') {
                    await window.go.main.App.OpenURL(protocolURL);
                    return;
                }
            } catch (err) {
                console.error('Error calling OpenURL backend:', err);
            }

            // Fallbacks
            try { Runtime.BrowserOpenURL(protocolURL); return; } catch (e) { /* continue */ }
            try { window.location.href = protocolURL; return; } catch (e) { /* continue */ }
            try { window.open(protocolURL, '_blank'); return; } catch (e) { Utils.showNotification('Error', 'Failed to open Discord link', 'error'); }

        } catch (err) {
            console.error('openSelectedProjectDiscord error:', err);
            Utils.showNotification('Error', 'Failed to open Discord link', 'error');
        }
    }

    async start() {
        console.log('Start function called. Project selector value:', this.projectSelector.value);
        
        if (!this.projectSelector.value) {
            Utils.showNotification('Error', 'Please select a project first', 'error');
            return;
        }

        try {
            if (!this.isRunning && !this.isPaused) {
                // Starting new timer
                console.log('Starting new timer');
                this.currentProjectId = parseInt(this.projectSelector.value);
                this.startTime = new Date();
                
                console.log('Creating time block with project ID:', this.currentProjectId, 'start time:', this.startTime);
                console.log('Start time details:', {
                    localString: this.startTime.toLocaleDateString(),
                    utcString: this.startTime.toUTCString(),
                    isoString: this.startTime.toISOString(),
                    timezoneOffset: this.startTime.getTimezoneOffset()
                });
                
                // Create new time block
                const timeBlockData = {
                    project_id: this.currentProjectId,
                    start_time: this.startTime,
                    end_time: null,
                    duration: 0,
                    is_manual: false,
                    description: null
                };

                const timeBlock = await API.createTimeBlock(timeBlockData);
                this.currentTimeBlockId = timeBlock.id;
                this.elapsedSeconds = 0;
                
                console.log('Time block created with ID:', this.currentTimeBlockId);
                
                // Dispatch event to refresh time blocks
                window.dispatchEvent(new CustomEvent('timeBlockUpdated'));
                
                Utils.showNotification('Timer Started', 'Time tracking has begun!', 'success');
            } else if (this.isPaused) {
                // Resuming paused timer
                console.log('Resuming paused timer');
                // Add the time spent paused to total paused time
                if (this.pauseStartTime) {
                    const pauseDuration = (Date.now() - this.pauseStartTime.getTime()) / 1000;
                    this.totalPausedTime += pauseDuration;
                    this.pauseStartTime = null;
                    console.log('Added pause duration:', pauseDuration, 'Total paused time:', this.totalPausedTime);
                }
                Utils.showNotification('Timer Resumed', 'Time tracking resumed!', 'success');
            }

            this.isRunning = true;
            this.isPaused = false;
            this.updateButtons();
            this.updateContainerClass();
            this.startInterval();
            
            // Dispatch timer state change event
            window.dispatchEvent(new CustomEvent('timerStateChanged', {
                detail: { isRunning: this.isRunning, isPaused: this.isPaused }
            }));
            
        } catch (error) {
            console.error('Error starting timer:', error);
            Utils.showNotification('Error', 'Failed to start timer', 'error');
        }
    }

    async pause() {
        console.log('Pause function called. Running:', this.isRunning);
        
        if (!this.isRunning) {
            console.log('Cannot pause: timer not running');
            return;
        }

        try {
            this.isRunning = false;
            this.isPaused = true;
            this.pauseStartTime = new Date(); // Record when pause started
            this.stopInterval();
            this.updateButtons();
            this.updateContainerClass();
            
            console.log('Timer paused successfully');
            Utils.showNotification('Timer Paused', 'Time tracking paused', 'warning');
            
            // Dispatch timer state change event
            window.dispatchEvent(new CustomEvent('timerStateChanged', {
                detail: { isRunning: this.isRunning, isPaused: this.isPaused }
            }));
        } catch (error) {
            console.error('Error pausing timer:', error);
            Utils.showNotification('Error', 'Failed to pause timer', 'error');
        }
    }

    async stop() {
        if (!this.isRunning && !this.isPaused) return;

        if (this.currentTimeBlockId) {
            try {
                // If currently paused, add the current pause time to total paused time
                if (this.isPaused && this.pauseStartTime) {
                    const pauseDuration = (Date.now() - this.pauseStartTime.getTime()) / 1000;
                    this.totalPausedTime += pauseDuration;
                }
                
                console.log('Stopping timer with duration:', this.elapsedSeconds);
                
                // Stop the time block with the calculated duration
                await API.stopTimeBlockWithDuration(this.currentTimeBlockId, this.elapsedSeconds);
                
                // Dispatch event to refresh time blocks
                window.dispatchEvent(new CustomEvent('timeBlockUpdated'));
                
                Utils.showNotification('Timer Stopped', 'Time block saved successfully!', 'success');
            } catch (error) {
                console.error('Error stopping timer:', error);
                Utils.showNotification('Error', 'Failed to stop timer', 'error');
            }
        }

        this.resetTimer();
    }

    async reset() {
        try {
            if (this.isRunning && this.currentTimeBlockId) {
                // Stop and delete the current time block
                await API.deleteTimeBlock(this.currentTimeBlockId);
            }

            this.resetTimer();
            Utils.showNotification('Timer Reset', 'Timer has been reset', 'success');
            
            // Dispatch timer state change event
            window.dispatchEvent(new CustomEvent('timerStateChanged', {
                detail: { isRunning: this.isRunning, isPaused: this.isPaused }
            }));
        } catch (error) {
            console.error('Error resetting timer:', error);
            Utils.showNotification('Error', 'Failed to reset timer', 'error');
        }
    }

    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentProjectId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.totalPausedTime = 0;
        this.pauseStartTime = null;
        this.currentTimeBlockId = null;
        this.elapsedSeconds = 0;
        this.stopInterval();
        this.updateDisplay();
        this.updateButtons();
        this.updateContainerClass();
        
        // Dispatch timer state change event when resetting
        window.dispatchEvent(new CustomEvent('timerStateChanged', {
            detail: { isRunning: this.isRunning, isPaused: this.isPaused }
        }));
    }

    startInterval() {
        console.log('Starting timer interval');
        this.stopInterval(); // Clear any existing interval
        this.interval = setInterval(() => {
            if (this.isRunning && this.startTime) {
                // Calculate elapsed time excluding paused time
                const now = new Date();
                const totalElapsed = (now.getTime() - this.startTime.getTime()) / 1000;
                this.elapsedSeconds = Math.floor(totalElapsed - this.totalPausedTime);
                
                // Ensure we don't show negative time
                if (this.elapsedSeconds < 0) {
                    this.elapsedSeconds = 0;
                }
                
                this.updateDisplay();
            }
        }, 1000);
    }

    stopInterval() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    updateDisplay() {
        const displayTime = this.elapsedSeconds;
        const formattedTime = Utils.formatDuration(displayTime);
        
        if (this.timerDisplay) {
            this.timerDisplay.textContent = formattedTime;
        } else {
            console.error('Timer display element not found!');
        }
    }

    updateButtons() {
        if (this.isRunning) {
            // Timer is running - show pause and stop buttons
            this.startBtn.style.display = 'none';
            this.pauseBtn.disabled = false;
            this.pauseBtn.style.display = 'inline-flex';
            this.stopBtn.disabled = false;
            this.stopBtn.style.display = 'inline-flex';
            this.resetBtn.disabled = true;
            this.resetBtn.style.display = 'none';
        } else if (this.isPaused) {
            // Timer is paused - show resume, stop and reset buttons
            this.startBtn.style.display = 'inline-flex';
            this.startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            this.startBtn.disabled = false;
            this.pauseBtn.style.display = 'none';
            this.stopBtn.disabled = false;
            this.stopBtn.style.display = 'inline-flex';
            this.resetBtn.disabled = false;
            this.resetBtn.style.display = 'inline-flex';
        } else {
            // Timer is stopped - show only start button
            this.startBtn.style.display = 'inline-flex';
            this.startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.pauseBtn.style.display = 'none';
            this.stopBtn.disabled = true;
            this.stopBtn.style.display = 'none';
            this.resetBtn.disabled = true;
            this.resetBtn.style.display = 'none';
        }
    }

    updateContainerClass() {
        this.timerContainer.classList.remove('running', 'paused');
        
        if (this.isRunning) {
            this.timerContainer.classList.add('running');
        } else if (this.isPaused) {
            this.timerContainer.classList.add('paused');
        }
    }

    getCurrentStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentProjectId: this.currentProjectId,
            elapsedSeconds: this.elapsedSeconds,
            startTime: this.startTime
        };
    }

    updateProjectUrlButton() {
        try {
            if (!this.projectSelector || !this.openProjectUrlBtn) return;
            const selectedOption = this.projectSelector.options[this.projectSelector.selectedIndex];
            const url = selectedOption ? selectedOption.getAttribute('data-url') : null;
            if (url && url.trim()) {
                this.openProjectUrlBtn.style.display = 'inline-flex';
                this.openProjectUrlBtn.title = '';
                this.openProjectUrlBtn.setAttribute('aria-label', 'Open project URL');
            } else {
                this.openProjectUrlBtn.style.display = 'none';
            }
            // Also handle directory button
            if (this.openProjectDirBtn) {
                const dir = selectedOption ? selectedOption.getAttribute('data-directory') : null;
                if (dir && dir.trim()) {
                    this.openProjectDirBtn.style.display = 'inline-flex';
                    this.openProjectDirBtn.title = '';
                    this.openProjectDirBtn.setAttribute('aria-label', 'Open project folder');
                } else {
                    this.openProjectDirBtn.style.display = 'none';
                }
            }
            // Also handle discord button
            if (this.openProjectDiscordBtn) {
                const discord = selectedOption ? selectedOption.getAttribute('data-discord') : null;
                if (discord && String(discord).trim()) {
                    this.openProjectDiscordBtn.style.display = 'inline-flex';
                    this.openProjectDiscordBtn.title = '';
                    this.openProjectDiscordBtn.setAttribute('aria-label', 'Open project Discord channel');
                } else {
                    this.openProjectDiscordBtn.style.display = 'none';
                }
            }

            // Also handle edit button visibility
            if (this.editProjectBtn) {
                const hasSelection = this.projectSelector && this.projectSelector.value;
                if (hasSelection) {
                    this.editProjectBtn.style.display = 'inline-flex';
                    this.editProjectBtn.title = '';
                    this.editProjectBtn.setAttribute('aria-label', 'Edit selected project');
                } else {
                    this.editProjectBtn.style.display = 'none';
                }
            }
        } catch (err) {
            console.warn('Failed to update project URL button:', err);
        }
    }

    async editSelectedProject() {
        try {
            if (!this.projectSelector || !this.projectSelector.value) {
                Utils.showNotification('Warning', 'Please select a project first', 'warning');
                return;
            }

            const projectId = parseInt(this.projectSelector.value);

            // Try to use the Projects module instance created in main (window.app.projects)
            const projectsModule = window.app && window.app.projects ? window.app.projects : null;
            if (projectsModule && typeof projectsModule.editProject === 'function') {
                await projectsModule.editProject(projectId);
                return;
            }

            // Fallback: attempt to fetch project and open project modal directly via API
            const project = await API.getProjectByID(projectId);
            if (project) {
                // As a last resort, open the Projects modal by dispatching an event
                window.dispatchEvent(new CustomEvent('openProjectEdit', { detail: { project } }));
            } else {
                Utils.showNotification('Error', 'Failed to load project for editing', 'error');
            }
        } catch (err) {
            console.error('Error editing selected project:', err);
            Utils.showNotification('Error', 'Failed to open project editor', 'error');
        }
    }

    async openSelectedProjectUrl() {
        try {
            if (!this.projectSelector) return;
            const selectedOption = this.projectSelector.options[this.projectSelector.selectedIndex];
            const url = selectedOption ? selectedOption.getAttribute('data-url') : null;
            if (!url) {
                Utils.showNotification('Warning', 'Selected project has no URL', 'warning');
                return;
            }

            // Use Wails runtime to open in default browser
            try {
                const { BrowserOpenURL } = await import('../../wailsjs/runtime/runtime.js');
                BrowserOpenURL(url);
            } catch (err) {
                // Fallback
                window.open(url, '_blank');
            }

            Utils.showNotification('Opening URL', 'Opening project URL in browser...', 'success');
        } catch (err) {
            console.error('Error opening project URL:', err);
            Utils.showNotification('Error', 'Failed to open project URL', 'error');
        }
    }

    async openSelectedProjectDir() {
        try {
            if (!this.projectSelector) return;
            const selectedOption = this.projectSelector.options[this.projectSelector.selectedIndex];
            const dir = selectedOption ? selectedOption.getAttribute('data-directory') : null;
            if (!dir) {
                Utils.showNotification('Warning', 'Selected project has no directory', 'warning');
                return;
            }

            // Prefer calling backend OpenDirectory exposed by Wails
            try {
                if (window.go && window.go.main && window.go.main.App && typeof window.go.main.App.OpenDirectory === 'function') {
                    await window.go.main.App.OpenDirectory(dir);
                } else {
                    // Fallback to runtime open
                    const { BrowserOpenURL } = await import('../../wailsjs/runtime/runtime.js');
                    try { BrowserOpenURL('file://' + dir); } catch (e) { window.open('file://' + dir); }
                }
                Utils.showNotification('Opening folder', 'Opening project folder in file explorer...', 'success');
            } catch (err) {
                console.error('Error opening project directory:', err);
                Utils.showNotification('Error', 'Failed to open project folder', 'error');
            }
        } catch (err) {
            console.error('Error in openSelectedProjectDir:', err);
            Utils.showNotification('Error', 'Failed to open project folder', 'error');
        }
    }

    // Clean up when page unloads
    cleanup() {
        this.stopInterval();
    }
}

export default Timer;
