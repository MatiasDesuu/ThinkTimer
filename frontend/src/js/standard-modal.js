/**
 * Standard Modal System
 * Reusable modal component for consistent UI across the application
 */

class StandardModal {
    constructor(id, options = {}) {
        this.id = id;
        this.options = {
            title: '',
            icon: '',
            iconType: 'project', // project, timeblock, warning, danger
            closable: true,
            ...options
        };
        this.modal = null;
        this.onClose = null;
        this.onSubmit = null;
        this.isVisible = false;
        
        this.createModal();
    }

    createModal() {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.id = this.id;
        this.modal.className = 'standard-modal';
        
        // Modal content structure
        this.modal.innerHTML = `
            <div class="standard-modal-content">
                <div class="standard-modal-header">
                    <div class="standard-modal-icon ${this.options.iconType}">
                        <i class="${this.options.icon}"></i>
                    </div>
                    <h2 class="standard-modal-title">${this.options.title}</h2>
                    ${this.options.closable ? '<button type="button" class="standard-modal-close">&times;</button>' : ''}
                </div>
                <div class="standard-modal-body">
                    <!-- Content will be inserted here -->
                </div>
                <div class="standard-modal-actions">
                    <!-- Actions will be inserted here -->
                </div>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(this.modal);

        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        // Close button
        if (this.options.closable) {
            const closeBtn = this.modal.querySelector('.standard-modal-close');
            closeBtn?.addEventListener('click', () => this.hide());
        }

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    setTitle(title) {
        const titleEl = this.modal.querySelector('.standard-modal-title');
        if (titleEl) titleEl.textContent = title;
        return this;
    }

    setIcon(icon, iconType = 'project') {
        const iconEl = this.modal.querySelector('.standard-modal-icon');
        if (iconEl) {
            iconEl.className = `standard-modal-icon ${iconType}`;
            const iconI = iconEl.querySelector('i');
            if (iconI) iconI.className = icon;
        }
        return this;
    }

    setBody(content) {
        const bodyEl = this.modal.querySelector('.standard-modal-body');
        if (bodyEl) {
            if (typeof content === 'string') {
                bodyEl.innerHTML = content;
            } else {
                bodyEl.innerHTML = '';
                bodyEl.appendChild(content);
            }
        }
        return this;
    }

    setActions(actions) {
        const actionsEl = this.modal.querySelector('.standard-modal-actions');
        if (actionsEl) {
            actionsEl.innerHTML = '';
            
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.type = action.type || 'button';
                btn.className = `standard-modal-btn standard-modal-btn-${action.variant || 'secondary'}`;
                btn.textContent = action.text;
                
                if (action.onclick) {
                    btn.addEventListener('click', action.onclick);
                }
                
                actionsEl.appendChild(btn);
            });
        }
        return this;
    }

    show() {
        this.isVisible = true;
        this.modal.classList.add('active');
        
        // Focus management
        const firstInput = this.modal.querySelector('input, textarea, select, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 150);
        }

        return this;
    }

    hide() {
        this.isVisible = false;
        this.modal.classList.remove('active');
        
        if (this.onClose) {
            this.onClose();
        }

        return this;
    }

    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }

    onCloseCallback(callback) {
        this.onClose = callback;
        return this;
    }

    // Helper method to create form modal
    static createFormModal(id, options = {}) {
        const modal = new StandardModal(id, options);
        
        // Create form element
        const form = document.createElement('form');
        form.id = options.formId || `${id}-form`;
        
        // Move body content into form
        const originalBody = modal.modal.querySelector('.standard-modal-body');
        const originalActions = modal.modal.querySelector('.standard-modal-actions');
        
        // Wrap body and actions in form
        form.appendChild(originalBody.cloneNode(true));
        form.appendChild(originalActions.cloneNode(true));
        
        // Replace modal content structure
        const modalContent = modal.modal.querySelector('.standard-modal-content');
        const header = modalContent.querySelector('.standard-modal-header');
        
        modalContent.innerHTML = '';
        modalContent.appendChild(header);
        modalContent.appendChild(form);
        
        return modal;
    }
}

// Export for use in other modules
window.StandardModal = StandardModal;

export default StandardModal;
