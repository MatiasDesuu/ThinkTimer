// Utils Module - Utility functions
class Utils {
    // Format duration in seconds to HH:MM:SS
    static formatDuration(seconds) {
        if (seconds === null || seconds === undefined) return '00:00:00';
        
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Compact duration display: H:mm (if hours>0) or Xm (minutes)
    static formatDurationShort(seconds) {
        if (seconds === null || seconds === undefined) return '0m';
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}`;
        }
        return `${minutes}m`;
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

    // Format time based on settings
    static formatTime(date, format = null) {
        if (!date) return '';
        
        const d = new Date(date);
        
        // Get format from global settings if not provided
        const timeFormat = format || (window.appSettings?.settings?.timeFormat) || '24';
        
        if (timeFormat === '12') {
            return d.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else {
            return d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    }

    // Format date and time
    static formatDateTime(date, timeFormat = '24') {
        if (!date) return '';
        
        const d = new Date(date);
        const dateStr = this.formatDate(d);
        const timeStr = this.formatTime(d, timeFormat);
        
        return `${dateStr} at ${timeStr}`;
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

    // Get current date string
    static getCurrentDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // Get date string from date object
    static getDateString(date) {
        if (!date) return this.getCurrentDateString();
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // Format date for HTML date input (YYYY-MM-DD)
    static formatDateForInput(date) {
        if (!date) return '';
        return this.getDateString(date);
    }

    // Get readable date
    static getReadableDate(dateStr) {
        if (!dateStr) return this.formatDate(new Date());
        
        const date = new Date(dateStr + 'T00:00:00');
        return this.formatDate(date);
    }

    // Calculate duration between two dates
    static calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        return Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    // Get start of day for a date
    static getStartOfDay(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Get relative date (Today, Yesterday, etc.)
    static getRelativeDate(date) {
        const today = new Date();
        const targetDate = new Date(date);
        
        // Reset time to start of day for comparison
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === -1) {
            return 'Yesterday';
        } else if (diffDays === 1) {
            return 'Tomorrow';
        } else {
            return this.formatDate(date);
        }
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

    // Show notification with limit of 2 notifications
    static showNotification(title, message, type = 'success', duration = 3000) {
        // Respect user's notifications setting (localStorage takes precedence)
        const stored = localStorage.getItem('notificationsEnabled');
        if (stored !== null) {
            if (stored === '0') return null; // notifications disabled
        } else if (window.appSettings && window.appSettings.settings && window.appSettings.settings.notificationsEnabled === false) {
            return null;
        }

        // Ensure only one notification is visible at a time by removing any existing ones
        const existingNotifications = document.querySelectorAll('.timer-notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `timer-notification ${type}`;

        const iconClass = type === 'success' ? 'fas fa-check' : (type === 'warning' ? 'fas fa-exclamation' : 'fas fa-exclamation-triangle');

        // Structure: icon on the left, text block (title above body) on the right.
        notification.innerHTML = `
            <div class="timer-notification-body-wrapper">
                <div class="timer-notification-icon"><i class="${iconClass}"></i></div>
                <div class="timer-notification-text">
                    <div class="timer-notification-title">${title}</div>
                    <div class="timer-notification-body">${message}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Allow clicking anywhere on the notification to dismiss it (except interactive children)
        notification.addEventListener('click', (e) => {
            // If the click originated from a link, button, or form control, ignore
            const interactive = e.target.closest('a, button, input, textarea, select');
            if (interactive) return;
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
