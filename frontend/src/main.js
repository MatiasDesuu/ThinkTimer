// Main Application Module
import Timer from './js/timer.js';
import Projects from './js/projects.js';
import TimeBlocks from './js/timeblocks.js';
import Calendar from './js/calendar.js';
import Settings from './js/settings.js';
import NavBar from './js/navbar.js';
import Utils from './js/utils.js';
import API from './js/api.js';
import Dialog from './js/dialog.js';
import tooltipManager from './js/tooltip.js';

class App {
    constructor() {
        this.currentPage = 'home';
        this.timer = null;
        this.projects = null;
        this.timeBlocks = null;
        this.calendar = null;
        this.settings = null;
        this.navbar = null;
        
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
        
        // Initialize navbar (singleton, auto-initialized)
        this.navbar = NavBar.getInstance();
        
        // Initialize modules
        this.projects = new Projects();
        this.timeBlocks = new TimeBlocks(this.projects);
        this.timer = new Timer();
        this.calendar = new Calendar(this.projects, this.timeBlocks);

        // Create mini calendar instance for quick date selection popup
        try {
            this.miniCalendar = new Calendar(this.projects, this.timeBlocks, { mini: true, containerId: 'mini-calendar-container' });
            // Render the mini calendar initially (hidden container)
            this.miniCalendar.render();
        } catch (err) {
            console.warn('Failed to initialize mini calendar:', err);
        }
        
        // Connect timer to timeblocks for pause state awareness
        this.timeBlocks.setTimer(this.timer);
        this.calendar.setTimer(this.timer);
        
        // Initialize dialog system
        Dialog.instance = new Dialog();
        
        // Initialize UI
        this.initializeNavigation();
        this.initializeKeyboardShortcuts();
        this.initializeCustomURLButton();
    this.initializeMiniCalendarButton();
    this.initializeTodayTotalIndicator();
    this.initializeTodayProjectsPopup();
        // Debug helper: log nav spacing (gap/padding) in responsive to help diagnose spacing issues
        try {
            this._logNavSpacing = () => {
                try {
                    const navItems = document.querySelector('.nav-items');
                    const firstItem = document.querySelector('.nav-item');
                    if (!navItems || !firstItem) return;
                    const si = getComputedStyle(navItems);
                    const fi = getComputedStyle(firstItem);
                    console.group('NAV-SPACING-DEBUG');
                    console.log('viewport-width:', window.innerWidth);
                    console.log('.nav-items gap:', si.getPropertyValue('gap') || si.gap);
                    console.log('.nav-items row-gap:', si.getPropertyValue('row-gap') || si.rowGap);
                    console.log('.nav-items padding:', si.padding);
                    console.log('.nav-item padding:', fi.padding);
                    console.log('.nav-item margin:', fi.margin);
                    console.log('.nav-item height:', fi.height);
                    console.log('.nav-item line-height:', fi.lineHeight);
                    console.groupEnd();
                } catch (e) {
                    // ignore
                }
            };

            // run immediately and on resize (debounced)
            this._logNavSpacing();
            let __navDebugTimer = null;
            window.addEventListener('resize', () => {
                if (__navDebugTimer) clearTimeout(__navDebugTimer);
                __navDebugTimer = setTimeout(() => this._logNavSpacing(), 180);
            });
        } catch (e) {
            // ignore
        }
        this.disableNativeContextMenu();
        this.showPage('home');
        
        // Show initial date
        this.timeBlocks.updateDateDisplay();
        
        console.log('ThinkTimer App initialized successfully!');
    }

    initializeMiniCalendarButton() {
        const miniBtn = document.getElementById('open-mini-calendar');
        const miniPopup = document.getElementById('mini-calendar-popup');

        if (!miniBtn || !miniPopup) return;

        // Toggle popup and compute position once when opening so it appears
        // just below the header/buttons. Clean up inline styles after hide
        // transition finishes to avoid jumps.
        const applyInlinePositionOnce = () => {
            try {
                const rect = miniBtn.getBoundingClientRect();
                const docEl = document.documentElement;
                const navWidth = parseFloat(getComputedStyle(docEl).getPropertyValue('--nav-width')) || 0;
                const gap = 8;
                const top = rect.bottom + window.scrollY + gap;
                // Ensure the popup is removed from any stacking context by
                // temporarily moving it to the document body. We'll reattach
                // back to its original parent after hide transition completes.
                if (miniPopup.parentElement !== document.body) {
                    // store original location for reattachment
                    miniPopup._originalParent = miniPopup.parentElement;
                    miniPopup._originalNextSibling = miniPopup.nextSibling;
                    document.body.appendChild(miniPopup);
                    miniPopup._teleported = true;
                }

                miniPopup.style.setProperty('position', 'fixed', 'important');
                miniPopup.style.setProperty('top', `${top}px`, 'important');
                // Only force left/right/width on narrow viewports. On desktop we
                // want the CSS media-query (.mini-calendar-popup { width:320px })
                // to control the popup width so it appears as a small widget
                // instead of spanning the content area.
                if (window.innerWidth < 769) {
                    miniPopup.style.setProperty('left', `${navWidth + 12}px`, 'important');
                    miniPopup.style.setProperty('right', `12px`, 'important');
                    miniPopup.style.setProperty('width', 'auto', 'important');
                    miniPopup.style.setProperty('max-width', `calc(100vw - ${navWidth + 24}px)`, 'important');
                } else {
                    // Desktop: prefer CSS placement. Ensure right is set so popup
                    // aligns to the header's right side if needed.
                    miniPopup.style.setProperty('right', `20px`, 'important');
                    // Remove left/width overrides in case they were left from a
                    // previous small-viewport open.
                    miniPopup.style.removeProperty('left');
                    miniPopup.style.removeProperty('width');
                    miniPopup.style.removeProperty('max-width');
                }
                // Ensure it sits above other UI (tooltips/modals)
                miniPopup.style.setProperty('z-index', '100000', 'important');
            } catch (err) {
                // ignore
            }
        };

        const clearInlinePosition = () => {
            miniPopup.style.removeProperty('position');
            miniPopup.style.removeProperty('top');
            miniPopup.style.removeProperty('left');
            miniPopup.style.removeProperty('right');
            miniPopup.style.removeProperty('width');
            miniPopup.style.removeProperty('max-width');
            miniPopup.style.removeProperty('z-index');
        };

        const togglePopup = (show) => {
            if (show) {
                // compute position once and then show
                applyInlinePositionOnce();
                // ensure repaint before adding show class to allow transition from positioned state
                requestAnimationFrame(() => miniPopup.classList.add('show'));
            } else {
                // hide and wait for transition to finish before clearing inline styles
                miniPopup.classList.remove('show');

                let cleaned = false;
                const cleanUp = () => {
                    if (cleaned) return;
                    cleaned = true;
                    clearInlinePosition();
                    // If we teleported the popup to the body, reattach it
                    // back to its original parent at the same place in the DOM.
                    try {
                        if (miniPopup._teleported && miniPopup._originalParent) {
                            const parent = miniPopup._originalParent;
                            const next = miniPopup._originalNextSibling;
                            if (next) parent.insertBefore(miniPopup, next);
                            else parent.appendChild(miniPopup);
                        }
                    } catch (e) {
                        // ignore reattach errors
                    }
                    // cleanup temp markers
                    delete miniPopup._teleported;
                    delete miniPopup._originalParent;
                    delete miniPopup._originalNextSibling;

                    miniPopup.removeEventListener('transitionend', onTransitionEnd);
                    if (transitionFallback) clearTimeout(transitionFallback);
                };

                const onTransitionEnd = (ev) => {
                    if (ev.propertyName === 'opacity' || ev.propertyName === 'transform') {
                        cleanUp();
                    }
                };

                const transitionFallback = setTimeout(() => cleanUp(), 350);
                miniPopup.addEventListener('transitionend', onTransitionEnd);
            }
        };

        miniBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = miniPopup.classList.contains('show');
            // Hide any tooltip currently shown for the button
            try { window.tooltipManager?.hide(); } catch (err) {}
            togglePopup(!isVisible);
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!miniPopup.contains(e.target) && e.target !== miniBtn) {
                togglePopup(false);
            }
        });

        // Listen for selection from mini calendar
        window.addEventListener('miniDateSelected', (ev) => {
            const date = ev.detail && ev.detail.date ? new Date(ev.detail.date) : null;
            if (!date) return;

            // Navigate to home and set the timeBlocks date to the selected date
            this.showPage('home');
            try {
                this.timeBlocks.setCurrentDate(date);
                // Also ensure home view reloads time blocks
                this.timeBlocks.loadTimeBlocks();
            } catch (err) {
                console.warn('Error setting date from mini calendar:', err);
            }

            // Hide popup (use class toggle to allow animation)
            togglePopup(false);
            // Ensure any tooltip is hidden after selection
            try { window.tooltipManager?.hide(); } catch (err) {}
        });
    }

    initializeTodayProjectsPopup() {
        this.todayProjectsBtn = document.getElementById('today-total');
        this.todayProjectsPopup = document.getElementById('today-projects-popup');
        this.todayProjectsContainer = document.getElementById('today-projects-container');

        if (!this.todayProjectsBtn || !this.todayProjectsPopup || !this.todayProjectsContainer) return;

        const applyInlinePositionOnce = () => {
            try {
                const rect = this.todayProjectsBtn.getBoundingClientRect();
                const docEl = document.documentElement;
                const navWidth = parseFloat(getComputedStyle(docEl).getPropertyValue('--nav-width')) || 0;
                const gap = 8;
                const top = rect.bottom + window.scrollY + gap;

                if (this.todayProjectsPopup.parentElement !== document.body) {
                    this.todayProjectsPopup._originalParent = this.todayProjectsPopup.parentElement;
                    this.todayProjectsPopup._originalNextSibling = this.todayProjectsPopup.nextSibling;
                    document.body.appendChild(this.todayProjectsPopup);
                    this.todayProjectsPopup._teleported = true;
                }

                this.todayProjectsPopup.style.setProperty('position', 'fixed', 'important');
                this.todayProjectsPopup.style.setProperty('top', `${top}px`, 'important');
                if (window.innerWidth < 769) {
                    this.todayProjectsPopup.style.setProperty('left', `${navWidth + 12}px`, 'important');
                    this.todayProjectsPopup.style.setProperty('right', `12px`, 'important');
                    this.todayProjectsPopup.style.setProperty('width', 'auto', 'important');
                    this.todayProjectsPopup.style.setProperty('max-width', `calc(100vw - ${navWidth + 24}px)`, 'important');
                } else {
                    // Anchor the popup under the today button (use its left edge) instead
                    // of aligning it to the header right which previously placed it under
                    // the date selector. Ensure popup won't overflow the viewport.
                    const popupWidth = this.todayProjectsPopup.offsetWidth || 320;
                    let left = rect.left;
                    const margin = 12; // keep some space from the edge
                    if (left + popupWidth + margin > window.innerWidth) {
                        left = Math.max(margin, window.innerWidth - popupWidth - margin);
                    }
                    // ensure not negative
                    left = Math.max(margin, left);
                    this.todayProjectsPopup.style.setProperty('left', `${left}px`, 'important');
                    this.todayProjectsPopup.style.removeProperty('right');
                    this.todayProjectsPopup.style.removeProperty('width');
                    this.todayProjectsPopup.style.removeProperty('max-width');
                    this.todayProjectsPopup.style.setProperty('transform-origin', 'top left', 'important');
                }
                this.todayProjectsPopup.style.setProperty('z-index', '100000', 'important');
            } catch (err) {
                // ignore
            }
        };

        const clearInlinePosition = () => {
            this.todayProjectsPopup.style.removeProperty('position');
            this.todayProjectsPopup.style.removeProperty('top');
            this.todayProjectsPopup.style.removeProperty('left');
            this.todayProjectsPopup.style.removeProperty('right');
            this.todayProjectsPopup.style.removeProperty('width');
            this.todayProjectsPopup.style.removeProperty('max-width');
            this.todayProjectsPopup.style.removeProperty('z-index');
        };

        const togglePopup = async (show) => {
            if (show) {
                // fetch and render project totals for the selected date
                try {
                    let targetDate = null;
                    if (this.timeBlocks && this.timeBlocks.currentDate) targetDate = new Date(this.timeBlocks.currentDate);
                    else {
                        const t = new Date();
                        targetDate = new Date(t.getFullYear(), t.getMonth(), t.getDate());
                    }

                    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
                    const timeBlocks = await API.getTimeBlocksByDate(startOfDay) || [];

                    // Group by project id/name and sum duration
                    const totalsByProject = {};
                    const now = new Date();
                    timeBlocks.forEach(tb => {
                        const key = tb.project_id || tb.project_name || 'unknown';
                        const name = tb.project_name || 'Unknown Project';
                        let seconds = 0;
                        if (!tb.end_time) {
                            seconds = Utils.calculateDuration(tb.start_time, now);
                        } else if (tb.duration !== undefined && tb.duration !== null) {
                            seconds = tb.duration;
                        } else {
                            seconds = Utils.calculateDuration(tb.start_time, tb.end_time);
                        }

                        if (!totalsByProject[key]) totalsByProject[key] = { name, seconds: 0 };
                        totalsByProject[key].seconds += seconds;
                    });

                    // Render list
                    const items = Object.keys(totalsByProject).map(k => {
                        const p = totalsByProject[k];
                        // Render as: [icon] Project Name | 1h 20m
                        // Use folder icon by default; future: use project-specific icon if available
                        return `<div class="today-project-item"><div class="project-left"><i class="fas fa-folder"></i></div><div class="project-name">${Utils.escapeHtml(p.name)}</div><div class="project-duration">${Utils.formatDuration(p.seconds)}</div></div>`;
                    });

                    this.todayProjectsContainer.innerHTML = items.length ? items.join('') : `<div class="empty-state"><i class="fas fa-clock"></i><div>No projects tracked today</div></div>`;
                } catch (err) {
                    console.error('Error loading today projects:', err);
                    this.todayProjectsContainer.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><div>Failed to load</div></div>`;
                }

                // compute position and show
                applyInlinePositionOnce();
                requestAnimationFrame(() => this.todayProjectsPopup.classList.add('show'));
            } else {
                this.todayProjectsPopup.classList.remove('show');

                let cleaned = false;
                const cleanUp = () => {
                    if (cleaned) return;
                    cleaned = true;
                    clearInlinePosition();
                    try {
                        if (this.todayProjectsPopup._teleported && this.todayProjectsPopup._originalParent) {
                            const parent = this.todayProjectsPopup._originalParent;
                            const next = this.todayProjectsPopup._originalNextSibling;
                            if (next) parent.insertBefore(this.todayProjectsPopup, next);
                            else parent.appendChild(this.todayProjectsPopup);
                        }
                    } catch (e) {
                        // ignore
                    }
                    delete this.todayProjectsPopup._teleported;
                    delete this.todayProjectsPopup._originalParent;
                    delete this.todayProjectsPopup._originalNextSibling;

                    this.todayProjectsPopup.removeEventListener('transitionend', onTransitionEnd);
                    if (transitionFallback) clearTimeout(transitionFallback);
                };

                const onTransitionEnd = (ev) => {
                    if (ev.propertyName === 'opacity' || ev.propertyName === 'transform') {
                        cleanUp();
                    }
                };

                const transitionFallback = setTimeout(() => cleanUp(), 350);
                this.todayProjectsPopup.addEventListener('transitionend', onTransitionEnd);
            }
        };

        this.todayProjectsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = this.todayProjectsPopup.classList.contains('show');
            togglePopup(!isVisible);
        });

        document.addEventListener('click', (e) => {
            if (!this.todayProjectsPopup.contains(e.target) && e.target !== this.todayProjectsBtn) {
                togglePopup(false);
            }
        });
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

    initializeCustomURLButton() {
        const urlButton = document.getElementById('open-custom-url');
        if (urlButton) {
            urlButton.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.openCustomURL();
            });
        }

        // Listen for custom URL changes
        window.addEventListener('customUrlChanged', () => {
            this.settings.updateUrlButtonVisibility();
        });
    }

    // Show total duration worked today (sum of all time blocks for current date)
    initializeTodayTotalIndicator() {
        this.todayTotalEl = document.getElementById('today-total');
        if (!this.todayTotalEl) return;

        const update = async (date) => {
            try {
                // Use provided date (from dateChanged event) or the currently selected date
                let targetDate = null;
                if (date) targetDate = new Date(date);
                else if (this.timeBlocks && this.timeBlocks.currentDate) targetDate = new Date(this.timeBlocks.currentDate);
                else {
                    const t = new Date();
                    targetDate = new Date(t.getFullYear(), t.getMonth(), t.getDate());
                }

                const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
                const timeBlocks = await API.getTimeBlocksByDate(startOfDay) || [];

                let totalSeconds = 0;
                const now = new Date();
                timeBlocks.forEach(tb => {
                    if (!tb.end_time) {
                        // running block: calculate from start_time to now
                        totalSeconds += Utils.calculateDuration(tb.start_time, now);
                    } else if (tb.duration !== undefined && tb.duration !== null) {
                        totalSeconds += tb.duration;
                    } else {
                        // fallback: calculate from start/end
                        totalSeconds += Utils.calculateDuration(tb.start_time, tb.end_time);
                    }
                });

                const display = totalSeconds > 0 ? Utils.formatDurationShort(totalSeconds) : '0m';
                this.todayTotalEl.innerHTML = `<i class="fas fa-clock"></i> ${display}`;
                this.todayTotalEl.style.display = 'inline-flex';
            } catch (err) {
                console.error('Error updating today total indicator:', err);
                this.todayTotalEl.style.display = 'none';
            }
        };

        // Update initially using the current selected date if available
        update();

        // Update on timeblock changes (recompute for current selected date)
        window.addEventListener('timeBlockUpdated', () => update());

        // Also update when the date in timeBlocks changes (listen to custom event)
        window.addEventListener('dateChanged', (ev) => {
            const newDate = ev && ev.detail && ev.detail.date ? ev.detail.date : null;
            update(newDate);
        });
    }

    async openCustomURL() {
        try {
            const settings = window.appSettings?.settings || {};
            const customUrl = settings.customUrl;
            
            if (customUrl && customUrl.trim()) {
                // Import BrowserOpenURL from Wails runtime
                const { BrowserOpenURL } = await import('../wailsjs/runtime/runtime.js');
                BrowserOpenURL(customUrl);
                
                Utils.showNotification('Success', 'Opening URL in browser...', 'success');
            } else {
                Utils.showNotification('Warning', 'No custom URL configured. Please set it in Settings.', 'warning');
            }
        } catch (error) {
            console.error('Error opening custom URL:', error);
            Utils.showNotification('Error', 'Failed to open custom URL', 'error');
        }
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
                        // If timer is running or paused, stop and save the block.
                        // Reset (which deletes the block) should only be used when
                        // there's no active/paused timer.
                        if (this.timer && (this.timer.isRunning || this.timer.isPaused)) {
                            // call stop (async) to save duration and reset state
                            try { this.timer.stop(); } catch (err) { this.timer.reset(); }
                        } else {
                            this.timer.reset();
                        }
                        break;
                }
            }
        });
    }

    disableNativeContextMenu() {
        // Disable right-click context menu globally
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Also disable on window
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Ensure all current and future input/textarea elements have autocomplete="off"
        this.disableAutocomplete();
        
        // Monitor for dynamically added inputs
        this.observeForNewInputs();
    }

    disableAutocomplete() {
        // Apply to existing inputs and textareas
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (!input.hasAttribute('autocomplete')) {
                input.setAttribute('autocomplete', 'off');
            }
        });
    }

    observeForNewInputs() {
        // Create a MutationObserver to watch for new input elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is an input or textarea
                        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
                            if (!node.hasAttribute('autocomplete')) {
                                node.setAttribute('autocomplete', 'off');
                            }
                        }
                        // Check for inputs/textareas within the added node
                        const inputs = node.querySelectorAll ? node.querySelectorAll('input, textarea') : [];
                        inputs.forEach(input => {
                            if (!input.hasAttribute('autocomplete')) {
                                input.setAttribute('autocomplete', 'off');
                            }
                        });
                    }
                });
            });
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
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
