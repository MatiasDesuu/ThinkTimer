// Global Tooltip System - Provides automatic tooltip functionality
class TooltipManager {
    constructor() {
        this.tooltipContainer = null;
        this.currentTooltip = null;
        this.showDelay = 500; // ms to wait before showing tooltip
        this.hideDelay = 100; // ms to wait before hiding tooltip
        this.showTimeout = null;
        this.hideTimeout = null;
        
        this.init();
    }

    init() {
        // If DOM is already loaded, initialize immediately, otherwise wait for DOMContentLoaded
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.createGlobalContainer();
            this.initializeGlobalTooltips();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.createGlobalContainer();
                this.initializeGlobalTooltips();
            });
        }
    }

    createGlobalContainer() {
        // Create global tooltip container
        this.tooltipContainer = document.createElement('div');
        this.tooltipContainer.id = 'global-tooltip-container';
        document.body.appendChild(this.tooltipContainer);
    }

    initializeGlobalTooltips() {
        // Use event delegation to handle all tooltips globally
        // Use closest to allow child elements inside the tooltip target to trigger tooltips
        document.addEventListener('mouseenter', (e) => {
            try {
                const el = e.target && e.target.closest ? e.target.closest('[data-tooltip]') : null;
                if (el) this.showTooltip(el);
            } catch (err) {
                // ignore
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            try {
                const el = e.target && e.target.closest ? e.target.closest('[data-tooltip]') : null;
                if (el) this.hideTooltip();
            } catch (err) {
                // ignore
            }
        }, true);

        document.addEventListener('focus', (e) => {
            try {
                const el = e.target && e.target.closest ? e.target.closest('[data-tooltip]') : null;
                if (el) this.showTooltip(el);
            } catch (err) {
                // ignore
            }
        }, true);

        document.addEventListener('blur', (e) => {
            try {
                const el = e.target && e.target.closest ? e.target.closest('[data-tooltip]') : null;
                if (el) this.hideTooltip();
            } catch (err) {
                // ignore
            }
        }, true);

        this.attachGlobalListeners();
    }

    showTooltip(element, immediate = false) {
        // Clear any pending hide timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) return;

        const showTooltipNow = () => {
            // Hide any existing tooltip
            this.hideTooltip(true);

            // Create new tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;

            // Add position and theme classes
            const position = element.getAttribute('data-tooltip-position') || 'top';
            const theme = element.getAttribute('data-tooltip-theme') || 'default';
            
            tooltip.classList.add(position);
            if (theme !== 'default') {
                tooltip.classList.add(theme);
            }

            // Add to container
            this.tooltipContainer.appendChild(tooltip);
            this.currentTooltip = tooltip;

            // Position tooltip
            this.positionTooltip(element, tooltip, position);

            // Show tooltip with animation
            requestAnimationFrame(() => {
                tooltip.classList.add('show');
            });
        };

        if (immediate) {
            showTooltipNow();
        } else {
            // Clear any pending show timeout
            if (this.showTimeout) {
                clearTimeout(this.showTimeout);
            }
            
            this.showTimeout = setTimeout(showTooltipNow, this.showDelay);
        }
    }

    hideTooltip(immediate = false) {
        // Clear any pending show timeout
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }

        if (!this.currentTooltip) return;

        const hideTooltipNow = () => {
            if (this.currentTooltip) {
                this.currentTooltip.remove();
                this.currentTooltip = null;
            }
        };

        if (immediate) {
            hideTooltipNow();
        } else {
            this.hideTimeout = setTimeout(hideTooltipNow, this.hideDelay);
        }
    }

    positionTooltip(element, tooltip, position) {
        const elementRect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        let top, left;
        const margin = 8; // Distance from element

        // Calculate position based on preferred position
        switch (position) {
            case 'top':
                top = elementRect.top + scrollY - tooltipRect.height - margin;
                left = elementRect.left + scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);
                
                // Check if tooltip goes outside viewport and adjust
                if (top < scrollY + 10) {
                    // Switch to bottom
                    top = elementRect.bottom + scrollY + margin;
                    tooltip.classList.remove('top');
                    tooltip.classList.add('bottom');
                }
                break;

            case 'bottom':
                top = elementRect.bottom + scrollY + margin;
                left = elementRect.left + scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);
                
                if (top + tooltipRect.height > scrollY + viewportHeight - 10) {
                    // Switch to top
                    top = elementRect.top + scrollY - tooltipRect.height - margin;
                    tooltip.classList.remove('bottom');
                    tooltip.classList.add('top');
                }
                break;

            case 'left':
                top = elementRect.top + scrollY + (elementRect.height / 2) - (tooltipRect.height / 2);
                left = elementRect.left + scrollX - tooltipRect.width - margin;
                
                if (left < scrollX + 10) {
                    // Switch to right
                    left = elementRect.right + scrollX + margin;
                    tooltip.classList.remove('left');
                    tooltip.classList.add('right');
                }
                break;

            case 'right':
                top = elementRect.top + scrollY + (elementRect.height / 2) - (tooltipRect.height / 2);
                left = elementRect.right + scrollX + margin;
                
                if (left + tooltipRect.width > scrollX + viewportWidth - 10) {
                    // Switch to left
                    left = elementRect.left + scrollX - tooltipRect.width - margin;
                    tooltip.classList.remove('right');
                    tooltip.classList.add('left');
                }
                break;
        }

        // Ensure tooltip stays within viewport bounds
        left = Math.max(scrollX + 10, Math.min(left, scrollX + viewportWidth - tooltipRect.width - 10));
        top = Math.max(scrollY + 10, Math.min(top, scrollY + viewportHeight - tooltipRect.height - 10));

        // Apply position
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    attachGlobalListeners() {
        // Hide tooltips when scrolling
        document.addEventListener('scroll', () => {
            this.hideTooltip(true);
        }, true);

        // Hide tooltips when window loses focus
        window.addEventListener('blur', () => {
            this.hideTooltip(true);
        });

        // Hide tooltips on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideTooltip(true);
            }
        });

        // Hide tooltips on window resize
        window.addEventListener('resize', () => {
            this.hideTooltip(true);
        });
    }

    // Public API methods
    
    /**
     * Add tooltip to an element programmatically
     * @param {Element} element - The element to add tooltip to
     * @param {string} text - Tooltip text
     * @param {Object} options - Tooltip options
     */
    addTooltip(element, text, options = {}) {
        element.setAttribute('data-tooltip', text);
        if (options.position) {
            element.setAttribute('data-tooltip-position', options.position);
        }
        if (options.theme) {
            element.setAttribute('data-tooltip-theme', options.theme);
        }
    }

    /**
     * Remove tooltip from an element
     * @param {Element} element - The element to remove tooltip from
     */
    removeTooltip(element) {
        element.removeAttribute('data-tooltip');
        element.removeAttribute('data-tooltip-position');
        element.removeAttribute('data-tooltip-theme');
    }

    /**
     * Update tooltip text
     * @param {Element} element - The element with tooltip
     * @param {string} newText - New tooltip text
     */
    updateTooltip(element, newText) {
        element.setAttribute('data-tooltip', newText);
    }

    /**
     * Show tooltip immediately (useful for programmatic triggers)
     * @param {Element} element - The element with tooltip
     */
    show(element) {
        this.showTooltip(element, true);
    }

    /**
     * Hide tooltip immediately
     */
    hide() {
        this.hideTooltip(true);
    }

    /**
     * Set global delays
     * @param {number} showDelay - Delay before showing tooltip (ms)
     * @param {number} hideDelay - Delay before hiding tooltip (ms)
     */
    setDelays(showDelay, hideDelay) {
        this.showDelay = showDelay;
        this.hideDelay = hideDelay;
    }
}

// Create global instance
const tooltipManager = new TooltipManager();

// Export for module usage
export default tooltipManager;

// Also make available globally for non-module usage
window.tooltipManager = tooltipManager;
