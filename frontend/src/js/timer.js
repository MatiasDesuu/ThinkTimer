// Timer Module - Handles timer functionality
import API from './api.js';
import Utils from './utils.js';

class Timer {
    constructor() {
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

        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.projectSelector = document.getElementById('project-selector');
        this.timerDisplay = document.getElementById('timer-display');
        this.startBtn = document.getElementById('start-timer');
        this.pauseBtn = document.getElementById('pause-timer');
        this.stopBtn = document.getElementById('stop-timer');
        this.resetBtn = document.getElementById('reset-timer');
        this.timerContainer = document.querySelector('.timer-container');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.resetBtn.addEventListener('click', () => this.reset());
    }

    async start() {
        if (!this.projectSelector.value) {
            Utils.showNotification('Error', 'Please select a project first', 'error');
            return;
        }

        try {
            if (!this.isRunning && !this.isPaused) {
                // Starting new timer
                this.currentProjectId = parseInt(this.projectSelector.value);
                this.startTime = new Date();
                
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
                
                // Dispatch event to refresh time blocks
                window.dispatchEvent(new CustomEvent('timeBlockUpdated'));
                
                Utils.showNotification('Timer Started', 'Time tracking has begun!', 'success');
            } else if (this.isPaused) {
                // Resuming paused timer
                // Add the time spent paused to total paused time
                if (this.pauseStartTime) {
                    const pauseDuration = (Date.now() - this.pauseStartTime.getTime()) / 1000;
                    this.totalPausedTime += pauseDuration;
                    this.pauseStartTime = null;
                }
                Utils.showNotification('Timer Resumed', 'Time tracking resumed!', 'success');
            }

            this.isRunning = true;
            this.isPaused = false;
            this.updateButtons();
            this.updateContainerClass();
            this.startInterval();
            
        } catch (error) {
            console.error('Error starting timer:', error);
            Utils.showNotification('Error', 'Failed to start timer', 'error');
        }
    }

    async pause() {
        if (!this.isRunning) return;

        try {
            this.isRunning = false;
            this.isPaused = true;
            this.pauseStartTime = new Date(); // Record when pause started
            this.stopInterval();
            this.updateButtons();
            this.updateContainerClass();
            
            Utils.showNotification('Timer Paused', 'Time tracking paused', 'warning');
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
                
                // Stop the time block using the simpler API call
                await API.stopRunningTimeBlock(this.currentTimeBlockId);
                
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
    }

    startInterval() {
        this.stopInterval(); // Clear any existing interval
        this.interval = setInterval(() => {
            if (this.isRunning && this.startTime) {
                // Calculate elapsed time excluding paused time
                const totalElapsed = (Date.now() - this.startTime.getTime()) / 1000;
                this.elapsedSeconds = Math.floor(totalElapsed - this.totalPausedTime);
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
        this.timerDisplay.textContent = Utils.formatDuration(displayTime);
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

    // Clean up when page unloads
    cleanup() {
        this.stopInterval();
    }
}

export default Timer;
