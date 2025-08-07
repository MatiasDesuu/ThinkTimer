// Dialog Module - Custom dialog system
class Dialog {
    constructor() {
        this.overlay = document.getElementById('custom-dialog');
        this.dialog = this.overlay?.querySelector('.custom-dialog');
        this.icon = document.getElementById('custom-dialog-icon');
        this.iconContainer = this.icon?.parentElement;
        this.title = document.getElementById('custom-dialog-title');
        this.message = document.getElementById('custom-dialog-message');
        this.cancelBtn = document.getElementById('custom-dialog-cancel');
        this.confirmBtn = document.getElementById('custom-dialog-confirm');
        
        this.bindEvents();
    }

    bindEvents() {
        // Close dialog when clicking overlay
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Cancel button
        this.cancelBtn?.addEventListener('click', (e) => {
            if (this.onCancel) {
                this.onCancel();
            }
            this.hide();
        });

        // Confirm button
        this.confirmBtn?.addEventListener('click', (e) => {
            if (this.onConfirm) {
                this.onConfirm();
            }
            this.hide();
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                if (this.onCancel) {
                    this.onCancel();
                }
                this.hide();
            }
        });
    }

    show(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure you want to perform this action?',
            icon = 'fa-question',
            iconType = 'warning',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmType = 'primary',
            onConfirm = null,
            onCancel = null
        } = options;

        if (!this.overlay) {
            throw new Error('Dialog overlay element not found');
        }

        // Set content
        if (this.title) this.title.textContent = title;
        if (this.message) this.message.textContent = message;
        if (this.icon) this.icon.className = `fas ${icon}`;
        
        // Set icon type
        if (this.iconContainer) this.iconContainer.className = `custom-dialog-icon ${iconType}`;
        
        // Set button texts
        if (this.confirmBtn) this.confirmBtn.textContent = confirmText;
        if (this.cancelBtn) this.cancelBtn.textContent = cancelText;
        
        // Set button types
        if (this.confirmBtn) this.confirmBtn.className = `custom-dialog-btn custom-dialog-btn-${confirmType}`;
        
        // Show dialog
        this.overlay.classList.add('show');
        
        // Focus confirm button
        setTimeout(() => {
            if (this.confirmBtn) {
                this.confirmBtn.focus();
            }
        }, 100);

        return new Promise((resolve) => {
            this.onConfirm = () => {
                if (onConfirm) onConfirm();
                resolve(true);
            };
            this.onCancel = () => {
                if (onCancel) onCancel();
                resolve(false);
            };
        });
    }

    hide() {
        this.overlay?.classList.remove('show');
        this.onConfirm = null;
        this.onCancel = null;
    }

    isVisible() {
        return this.overlay?.classList.contains('show');
    }

    // Static method for quick confirmations
    static async confirm(title, message, options = {}) {
        // Use singleton pattern - create only if doesn't exist
        if (!Dialog.instance) {
            Dialog.instance = new Dialog();
        }
        
        return await Dialog.instance.show({
            title,
            message,
            icon: 'fa-exclamation-triangle',
            iconType: 'warning',
            confirmText: 'Yes',
            cancelText: 'No',
            confirmType: 'danger',
            ...options
        });
    }

    // Static method for info dialogs
    static async info(title, message, options = {}) {
        if (!Dialog.instance) {
            Dialog.instance = new Dialog();
        }
        
        return await Dialog.instance.show({
            title,
            message,
            icon: 'fa-info-circle',
            iconType: 'info',
            confirmText: 'OK',
            cancelText: 'Cancel',
            confirmType: 'primary',
            ...options
        });
    }

    // Static method for success dialogs
    static async success(title, message, options = {}) {
        if (!Dialog.instance) {
            Dialog.instance = new Dialog();
        }
        
        return await Dialog.instance.show({
            title,
            message,
            icon: 'fa-check-circle',
            iconType: 'success',
            confirmText: 'OK',
            cancelText: 'Cancel',
            confirmType: 'primary',
            ...options
        });
    }

    // Static method for error dialogs
    static async error(title, message, options = {}) {
        if (!Dialog.instance) {
            Dialog.instance = new Dialog();
        }
        
        return await Dialog.instance.show({
            title,
            message,
            icon: 'fa-exclamation-circle',
            iconType: 'danger',
            confirmText: 'OK',
            cancelText: 'Cancel',
            confirmType: 'danger',
            ...options
        });
    }
}

export default Dialog;
