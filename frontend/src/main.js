// Main Application Module
import Timer from './js/timer.js';
import Projects from './js/projects.js';
import TimeBlocks from './js/timeblocks.js';
import Calendar from './js/calendar.js';
import Settings from './js/settings.js';
import Utils from './js/utils.js';
import Dialog from './js/dialog.js';

class App {
    constructor() {
        this.currentPage = 'home';
        this.timer = null;
        this.projects = null;
        this.timeBlocks = null;
        this.calendar = null;
        this.settings = null;
        
        this.init();
    }

    async init() {
        // Wait for Wails to be ready
        await this.waitForWails();
        
        // Initialize settings first (use the global instance)
        this.settings = Settings;
        this.settings.initializeTheme();
        
        // Make settings available globally for Utils
        window.appSettings = this.settings;
        
        // Initialize modules
        this.projects = new Projects();
        this.timeBlocks = new TimeBlocks(this.projects);
        this.timer = new Timer();
        this.calendar = new Calendar(this.projects, this.timeBlocks);
        
        // Initialize dialog system
        Dialog.instance = new Dialog();
        
        // Initialize UI
        this.initializeNavigation();
        this.initializeKeyboardShortcuts();
        this.showPage('home');
        
        // Show initial date
        this.timeBlocks.updateDateDisplay();
        
        console.log('ThinkTimer App initialized successfully!');
    }

    async waitForWails() {
        return new Promise((resolve) => {
            if (window.go) {
                resolve();
            } else {
                const checkWails = () => {
                    if (window.go) {
                        resolve();
                    } else {
                        setTimeout(checkWails, 100);
                    }
                };
                checkWails();
            }
        });
    }

    initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.showPage(page);
            });
        });
    }

    showPage(pageName) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Show selected page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });
        
        this.currentPage = pageName;
        
        // Page-specific initialization
        this.handlePageSwitch(pageName);
    }

    handlePageSwitch(pageName) {
        switch (pageName) {
            case 'home':
                // Refresh time blocks for current date
                this.timeBlocks.loadTimeBlocks();
                break;
            case 'projects':
                // Refresh projects list
                this.projects.loadProjects();
                break;
            case 'calendar':
                // Render calendar
                this.calendar.render();
                break;
            case 'settings':
                // Settings are automatically loaded
                break;
        }
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.showPage('home');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showPage('projects');
                        break;
                    case '3':
                        e.preventDefault();
                        this.showPage('calendar');
                        break;
                    case '4':
                        e.preventDefault();
                        this.showPage('settings');
                        break;
                    case 'n':
                        e.preventDefault();
                        if (this.currentPage === 'projects') {
                            this.projects.openModal();
                        }
                        break;
                    case 't':
                        e.preventDefault();
                        this.settings.toggleTheme();
                        break;
                }
            }

            // Timer shortcuts (only on home page)
            if (this.currentPage === 'home') {
                switch (e.key) {
                    case ' ':
                        e.preventDefault();
                        if (this.timer.isRunning) {
                            this.timer.pause();
                        } else {
                            this.timer.start();
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.timer.reset();
                        break;
                }
            }
        });
    }

    // Global error handling
    handleError(error) {
        console.error('Application error:', error);
        Utils.showNotification('Error', 'An unexpected error occurred', 'error');
    }

    // Application cleanup
    cleanup() {
        if (this.timer) {
            this.timer.cleanup();
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    Utils.showNotification('Error', 'An unexpected error occurred', 'error');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    Utils.showNotification('Error', 'An unexpected error occurred', 'error');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
});

export default App;
