// Navigation Bar Module - Handles navbar collapse/expand functionality
class NavBar {
    constructor() {
        this.nav = null;
        this.main = null;
        this.navToggle = null;
        this.isCollapsed = false;
        
        this.init();
    }

    init() {
        // Apply initial nav state before DOM is fully loaded
        this.applyInitialNavState();
        
        // Initialize elements and events when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeElements();
            this.initializeToggle();
            this.cleanupInitialState();
        });
    }

    initializeElements() {
        this.nav = document.querySelector('.nav');
        this.main = document.querySelector('.main');
        this.navToggle = document.getElementById('nav-toggle');
    }

    applyInitialNavState() {
        // This runs immediately via inline script in HTML to prevent flash
        // Just store the state for later use
        this.isCollapsed = localStorage.getItem('navCollapsed') === 'true';
    }

    cleanupInitialState() {
        // Transfer from initial state to regular collapsed state if needed
        if (this.nav && this.main && this.isCollapsed) {
            this.nav.classList.add('collapsed');
            this.nav.classList.add('collapsed-centered'); // Already centered on load
            this.main.classList.add('nav-collapsed');
        }
        
        // Remove initial class to enable transitions
        document.documentElement.classList.remove('nav-collapsed-init');
    }

    initializeToggle() {
        if (!this.navToggle || !this.nav || !this.main) {
            console.warn('NavBar: Required elements not found');
            return;
        }

        this.navToggle.addEventListener('click', () => {
            this.toggle();
        });
    }

    toggle() {
        // Check if currently collapsed (considering both states)
        const isCurrentlyCollapsed = this.nav.classList.contains('collapsed') || 
        document.documentElement.classList.contains('nav-collapsed-init');
        
        // Remove any initial state class
        document.documentElement.classList.remove('nav-collapsed-init');
        
        if (isCurrentlyCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    collapse() {
        if (!this.nav || !this.main) return;

        // Step 1: Add collapsed class (text disappears, width changes)
        this.nav.classList.add('collapsed');
        this.main.classList.add('nav-collapsed');
        
        // Step 2: Add centering class after width animation completes
        setTimeout(() => {
            if (this.nav.classList.contains('collapsed')) {
                this.nav.classList.add('collapsed-centered');
            }
        }, 300);
        
        // Update state
        this.isCollapsed = true;
        localStorage.setItem('navCollapsed', 'true');
        
        // Dispatch event for other components
        this.dispatchStateChangeEvent('collapsed');
    }

    expand() {
        if (!this.nav || !this.main) return;

        // Remove all classes immediately (positioning changes first, then size, then text)
        this.nav.classList.remove('collapsed');
        this.nav.classList.remove('collapsed-centered');
        this.main.classList.remove('nav-collapsed');
        
        // Update state
        this.isCollapsed = false;
        localStorage.setItem('navCollapsed', 'false');
        
        // Dispatch event for other components
        this.dispatchStateChangeEvent('expanded');
    }

    dispatchStateChangeEvent(state) {
        const event = new CustomEvent('navStateChanged', {
            detail: { 
                state: state,
                isCollapsed: this.isCollapsed 
            }
        });
        window.dispatchEvent(event);
    }

    // Public methods for external use
    getState() {
        return {
            isCollapsed: this.isCollapsed,
            element: this.nav
        };
    }

    forceCollapse() {
        if (!this.isCollapsed) {
            this.collapse();
        }
    }

    forceExpand() {
        if (this.isCollapsed) {
            this.expand();
        }
    }

    // Static method to get the singleton instance
    static getInstance() {
        if (!NavBar.instance) {
            NavBar.instance = new NavBar();
        }
        return NavBar.instance;
    }
}

// Auto-initialize when module is loaded
NavBar.getInstance();

export default NavBar;
