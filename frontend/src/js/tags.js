// Tags Module - Handles tag management
import API from './api.js';
import Utils from './utils.js';
import Dialog from './dialog.js';

class Tags {
    constructor() {
        this.tags = [];
        this.currentEditingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadTags();
    }

    initializeElements() {
        this.tagsList = document.getElementById('tags-list');
        this.addTagBtn = document.getElementById('add-tag');
        this.tagModal = document.getElementById('tag-modal');
        this.tagForm = document.getElementById('tag-form');
        this.tagModalTitle = document.getElementById('tag-modal-title');
        this.tagModalIcon = this.tagModal?.querySelector('.standard-modal-icon');
        this.cancelTagBtn = document.getElementById('cancel-tag');
        this.closeTagBtn = this.tagModal?.querySelector('.standard-modal-close');
        
        // Form fields
        this.nameField = document.getElementById('tag-name');
        this.colorField = document.getElementById('tag-color');
        this.colorPresets = document.querySelectorAll('.color-preset');
    }

    bindEvents() {
        this.addTagBtn.addEventListener('click', () => this.openModal());
        this.cancelTagBtn.addEventListener('click', () => this.closeModal());
        this.closeTagBtn?.addEventListener('click', () => this.closeModal());
        this.tagForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Color preset selection
        this.colorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.colorField.value = e.target.dataset.color;
            });
        });
        
        // Close modal when clicking outside
        this.tagModal.addEventListener('click', (e) => {
            if (e.target === this.tagModal) {
                this.closeModal();
            }
        });

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.tagModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    async loadTags() {
        try {
            this.tags = await API.getAllTags() || [];
            this.renderTags();
        } catch (error) {
            console.error('Error loading tags:', error);
            Utils.showNotification('Error', 'Failed to load tags', 'error');
            this.tags = [];
            this.renderTags();
        }
    }

    renderTags() {
        if (!this.tagsList) return;

        if (this.tags.length === 0) {
            this.tagsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>No Tags</h3>
                    <p>Create your first tag to organize your projects</p>
                </div>
            `;
        } else {
            this.tagsList.innerHTML = this.tags.map(tag => this.createTagCard(tag)).join('');
        }

        this.bindTagEvents();
    }

    createTagCard(tag) {
        return `
            <div class="tag-card" data-id="${tag.id}">
                <div class="tag-info">
                    <div class="tag-color-display" style="background-color: ${tag.color};">
                        <div class="tag-icon">
                            <i class="fas fa-tag"></i>
                        </div>
                    </div>
                    <div class="tag-details">
                        <h3 class="tag-name">${Utils.escapeHtml(tag.name)}</h3>
                        <div class="tag-meta">
                            <div class="tag-meta-item">
                                <i class="fas fa-calendar-plus"></i>
                                <span>Created: ${Utils.formatDate(tag.created_at)}</span>
                            </div>
                            <div class="tag-meta-item">
                                <i class="fas fa-palette"></i>
                                <span>Color: ${tag.color.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tag-actions">
                    <button class="tag-action-btn edit" data-action="edit" data-id="${tag.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="tag-action-btn delete" data-action="delete" data-id="${tag.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    bindTagEvents() {
        const actionButtons = this.tagsList?.querySelectorAll('.tag-action-btn') || [];
        
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);
                this.handleTagAction(action, id);
            });
        });
    }

    async handleTagAction(action, id) {
        try {
            switch (action) {
                case 'edit':
                    await this.editTag(id);
                    break;
                case 'delete':
                    await this.deleteTag(id);
                    break;
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            Utils.showNotification('Error', `Failed to ${action} tag`, 'error');
        }
    }

    async editTag(id) {
        const tag = this.tags.find(t => t.id === id);
        if (!tag) return;

        this.currentEditingId = id;
        this.tagModalTitle.textContent = 'Edit Tag';
        
        // Update icon for edit mode
        if (this.tagModalIcon) {
            this.tagModalIcon.className = 'standard-modal-icon tag-edit';
            const iconElement = this.tagModalIcon.querySelector('i');
            if (iconElement) {
                iconElement.className = 'fas fa-edit';
            }
        }
        
        // Populate form
        this.nameField.value = tag.name;
        this.colorField.value = tag.color;
        
        this.openModal();
    }

    async deleteTag(id) {
        const confirmed = await Dialog.confirm(
            'Delete Tag',
            'Are you sure you want to delete this tag? This action cannot be undone and will remove the tag from all associated projects.',
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                confirmType: 'danger'
            }
        );

        if (!confirmed) return;

        await API.deleteTag(id);
        await this.loadTags();
        Utils.showNotification('Success', 'Tag deleted successfully!', 'success');
    }

    openModal() {
        this.tagModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.nameField.focus();
    }

    closeModal() {
        this.tagModal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditingId = null;
        this.tagForm.reset();
        this.tagModalTitle.textContent = 'Add Tag';
        this.colorField.value = '#3b82f6'; // Reset to default color
        
        // Reset icon to add mode
        if (this.tagModalIcon) {
            this.tagModalIcon.className = 'standard-modal-icon tag';
            const iconElement = this.tagModalIcon.querySelector('i');
            if (iconElement) {
                iconElement.className = 'fas fa-tag';
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.tagForm);
        const tagData = {
            name: formData.get('name').trim(),
            color: formData.get('color')
        };

        // Validation
        if (!tagData.name) {
            Utils.showNotification('Error', 'Tag name is required', 'error');
            return;
        }

        try {
            if (this.currentEditingId) {
                // Update existing tag
                await API.updateTag(this.currentEditingId, tagData);
                Utils.showNotification('Success', 'Tag updated successfully!', 'success');
            } else {
                // Create new tag
                await API.createTag(tagData);
                Utils.showNotification('Success', 'Tag created successfully!', 'success');
            }

            this.closeModal();
            await this.loadTags();
            
            // Refresh projects page if tags component exists
            if (window.projects) {
                await window.projects.loadProjects();
            }
        } catch (error) {
            console.error('Error saving tag:', error);
            const message = error.message?.includes('already exists') ? 
                'A tag with this name already exists' : 'Failed to save tag';
            Utils.showNotification('Error', message, 'error');
        }
    }

    getTags() {
        return this.tags;
    }

    getTagById(id) {
        return this.tags.find(tag => tag.id === id);
    }
}

export default Tags;
