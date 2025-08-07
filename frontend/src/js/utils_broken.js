// Utils Module - Utility functions
class Utils {
    // Format duration in seconds to HH:MM:SS
    static formatDuration(seconds) {
        if (!seco    // Show notification
    static showNotification(title, message, type = 'success', duration = 3000) {
        // Check existing notifications and remove oldest if there are 2 or more
        const existingNotifications = document.querySelectorAll('.timer-notification');
        if (existingNotifications.length >= 2) {
            // Remove the oldest notification (first in the list)
            existingNotifications[0].remove();
        }

        const notification = document.createElement('div');
        notification.className = `timer-notification ${type}`;
        
        const iconClass = type === 'success' ? 'fas fa-check' : 'fas fa-exclamation-triangle';
        
        notification.innerHTML = `
            <div class="timer-notification-header">
                <div class="timer-notification-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="timer-notification-title">${title}</div>
                <button class="timer-notification-close">&times;</button>
            </div>
            <div class="timer-notification-body">${message}</div>
        `;

        document.body.appendChild(notification); return '00:00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Format date to readable string
    static formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        return d.toLocaleDateString('en-US', options);
    }

    // Format time to readable string
    static formatTime(date) {
        if (!date) return '';
        
        const d = new Date(date);
        
        // Try to get settings, fallback to 12-hour format if not available
        let timeFormat = '12';
        try {
            // Import settings dynamically to avoid circular imports
            if (window.appSettings && window.appSettings.getSettings) {
                const settings = window.appSettings.getSettings();
                timeFormat = settings.timeFormat || '12';
            }
        } catch (error) {
            // Fallback to 12-hour format
            timeFormat = '12';
        }
        
        const options = { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: timeFormat === '12'
        };
        
        return d.toLocaleTimeString([], options);
    }

    // Format datetime for HTML input
    static formatDateTimeForInput(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Format date for HTML input
    static formatDateForInput(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // Get start of day
    static getStartOfDay(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Get end of day
    static getEndOfDay(date) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // Get current date formatted for display
    static getCurrentDateFormatted() {
        return this.formatDate(new Date());
    }

    // Get relative date (today, yesterday, etc.)
    static getRelativeDate(date) {
        const today = new Date();
        const targetDate = new Date(date);
        const todayStart = this.getStartOfDay(today);
        const targetStart = this.getStartOfDay(targetDate);
        
        const diffTime = targetStart.getTime() - todayStart.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays === 1) return 'Tomorrow';
        
        return this.formatDate(date);
    }

    // Calculate duration between two dates
    static calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        return Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    // Debounce function
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Show notification
    static showNotification(title, message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `timer-notification ${type}`;
        
        const iconClass = type === 'success' ? 'fas fa-check' : 'fas fa-exclamation-triangle';
        
        notification.innerHTML = `
            <div class="timer-notification-header">
                <div class="timer-notification-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="timer-notification-title">${title}</div>
                <button class="timer-notification-close">&times;</button>
            </div>
            <div class="timer-notification-body">${message}</div>
        `;

        document.body.appendChild(notification);

        // Close button functionality
        const closeBtn = notification.querySelector('.timer-notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }

        return notification;
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate URL
    static isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Escape HTML
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Generate random ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Deep clone object
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Check if object is empty
    static isEmpty(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    // Get query parameter
    static getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Set query parameter
    static setQueryParam(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }
}

export default Utils;
