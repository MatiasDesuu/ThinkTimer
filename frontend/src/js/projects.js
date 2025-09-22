// Projects Module - Handles project management
import API from './api.js';
import Utils from './utils.js';
import Dialog from './dialog.js';
import Tooltip from './tooltip.js';
import * as Runtime from '../../wailsjs/runtime/runtime.js';

class Projects {
    constructor() {
        this.projects = [];
        this.currentEditingId = null;
        this.projectDurations = new Map(); // cache project total durations in seconds
        
        this.initializeElements();
        this.bindEvents();
        this.loadProjects();
    }

    initializeElements() {
        this.activeProjectsList = document.getElementById('active-projects-list');
        this.completedProjectsList = document.getElementById('completed-projects-list');
        this.completedProjectsSection = document.getElementById('completed-projects-section');
        this.addProjectBtn = document.getElementById('add-project');
        this.projectModal = document.getElementById('project-modal');
        this.projectForm = document.getElementById('project-form');
        this.projectModalTitle = document.getElementById('project-modal-title');
        this.projectModalIcon = this.projectModal?.querySelector('.standard-modal-icon');
        this.cancelProjectBtn = document.getElementById('cancel-project');
        this.closeProjectBtn = this.projectModal?.querySelector('.standard-modal-close');
        
        // Form fields
        this.nameField = document.getElementById('project-name');
        this.descriptionField = document.getElementById('project-description');
        this.urlField = document.getElementById('project-url');
    this.directoryField = document.getElementById('project-directory');
        this.deadlineField = document.getElementById('project-deadline');

        // Add tooltip to Add Project button via TooltipManager if available
        if (this.addProjectBtn) {
            try {
                Tooltip.addTooltip(this.addProjectBtn, 'Add project', { position: 'bottom' });
                this.addProjectBtn.setAttribute('aria-label', 'Add project');
                // remove native title if present to avoid duplicate tooltips
                this.addProjectBtn.removeAttribute('title');
            } catch (err) {
                // ignore; fallback to native title if present
            }
        }
    }

    bindEvents() {
        this.addProjectBtn.addEventListener('click', () => this.openModal());
        this.cancelProjectBtn.addEventListener('click', () => this.closeModal());
        this.closeProjectBtn?.addEventListener('click', () => this.closeModal());
        this.projectForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Close modal when clicking outside
        this.projectModal.addEventListener('click', (e) => {
            if (e.target === this.projectModal) {
                this.closeModal();
            }
        });

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.projectModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    async loadProjects() {
        try {
            this.projects = await API.getAllProjects() || [];
            this.renderProjects();
            this.updateProjectSelectors();
            // Notify other modules (calendar, timeblocks, etc.) that projects changed
            try { window.dispatchEvent(new CustomEvent('projectsUpdated')); } catch (e) { /* ignore */ }
        } catch (error) {
            console.error('Error loading projects:', error);
            Utils.showNotification('Error', 'Failed to load projects', 'error');
            this.projects = [];
            this.renderProjects();
        }
    }

    async renderProjects() {
        const activeProjects = this.projects.filter(p => p.status !== 'completed');
        const completedProjects = this.projects.filter(p => p.status === 'completed');

        // Render active projects
        if (!this.activeProjectsList) return;

        // Pre-fetch durations for visible projects to display totals
        await this.fetchProjectDurations([...activeProjects, ...completedProjects]);

        if (activeProjects.length === 0) {
            this.activeProjectsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Active Projects</h3>
                    <p>Create your first project to start tracking time</p>
                </div>
            `;
        } else {
            this.activeProjectsList.innerHTML = activeProjects.map(project => this.createProjectCard(project)).join('');
        }

        // Render completed projects
        if (completedProjects.length > 0) {
            this.completedProjectsSection.style.display = 'block';
            this.completedProjectsList.innerHTML = completedProjects.map(project => this.createProjectCard(project)).join('');
        } else {
            this.completedProjectsSection.style.display = 'none';
        }

        this.bindProjectEvents();
    }

    createProjectCard(project) {
        const statusClass = project.status || 'active';
        const deadline = project.deadline ? Utils.formatDate(project.deadline) : null;
        let statusIcon = '';
        if (statusClass === 'active') statusIcon = '<i class="fas fa-play-circle"></i>';
        else if (statusClass === 'paused') statusIcon = '<i class="fas fa-pause-circle"></i>';
        else if (statusClass === 'completed') statusIcon = '<i class="fas fa-check-circle"></i>';

    const totalSeconds = this.projectDurations.get(project.id) || 0;
    const totalDisplay = totalSeconds > 0 ? Utils.formatDurationShort(totalSeconds) : '0m';

        return `
            <div class="project-card" data-id="${project.id}">
                <div class="project-info">
                    <div class="project-header">
                        <div class="project-title-section">
                            <div class="project-title-row">
                                <span class="project-status-badge ${statusClass}">${statusIcon} ${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}</span>
                                <div class="project-total-time ${statusClass}"><i class="fas fa-clock"></i>${totalDisplay}</div>
                                <h3 class="project-title">${Utils.escapeHtml(project.name)}</h3>
                            </div>
                            ${project.description ? `
                                <p class="project-description">${Utils.escapeHtml(project.description)}</p>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="project-meta">
                        <div class="project-meta-item">
                            <i class="fas fa-calendar-plus"></i>
                            <span>Created: ${Utils.formatDate(project.created_at)}</span>
                        </div>
                        ${deadline ? `
                            <div class="project-meta-item">
                                <i class="fas fa-calendar-check"></i>
                                <span>Deadline: ${deadline}</span>
                            </div>
                        ` : ''}
                        ${project.url ? `
                            <div class="project-meta-item">
                                <i class="fas fa-link"></i>
                                <a href="${project.url}" target="_blank" class="project-url">${Utils.escapeHtml(project.url)}</a>
                            </div>
                        ` : ''}
                        ${project.directory ? `
                            <div class="project-meta-item">
                                <i class="fas fa-folder-open"></i>
                                <a href="#" class="project-directory" data-path="${Utils.escapeHtml(project.directory)}">${Utils.escapeHtml(project.directory)}</a>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="project-actions">
                    <button class="project-action-btn edit" data-action="edit" data-id="${project.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${project.status !== 'completed' ? `
                        <button class="project-action-btn ${project.status === 'active' ? 'pause' : 'resume'}" 
                                data-action="${project.status === 'active' ? 'pause' : 'resume'}" 
                                data-id="${project.id}"
                                title="${project.status === 'active' ? 'Pause' : 'Resume'}">
                            <i class="fas fa-${project.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="project-action-btn complete" data-action="complete" data-id="${project.id}" title="Complete">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : `
                        <button class="project-action-btn uncomplete" data-action="uncomplete" data-id="${project.id}" title="Mark as Active">
                            <i class="fas fa-undo"></i>
                        </button>
                    `}
                    <button class="project-action-btn delete" data-action="delete" data-id="${project.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    bindProjectEvents() {
        const actionButtons = [
            ...this.activeProjectsList?.querySelectorAll('.project-action-btn') || [],
            ...this.completedProjectsList?.querySelectorAll('.project-action-btn') || []
        ];
        
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);
                this.handleProjectAction(action, id);
            });
            // Register custom tooltip for each action button and remove native title
            try {
                const nativeTitle = btn.getAttribute('title');
                if (nativeTitle) {
                    Tooltip.addTooltip(btn, nativeTitle, { position: 'top' });
                    btn.removeAttribute('title');
                    btn.setAttribute('aria-label', nativeTitle);
                }
            } catch (err) {
                // ignore and leave native title if Tooltip not available
            }
        });

        // Open project URLs in the system default browser (not inside the app webview)
        const urlLinks = [
            ...this.activeProjectsList?.querySelectorAll('.project-url') || [],
            ...this.completedProjectsList?.querySelectorAll('.project-url') || []
        ];

        urlLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (!href) return;
                try {
                    Runtime.BrowserOpenURL(href);
                } catch (err) {
                    // Fallback: attempt to open via window.open if runtime fails
                    window.open(href, '_blank');
                }
            });
        });

        // Directory links - open folder in OS file explorer using backend
        const dirLinks = [
            ...this.activeProjectsList?.querySelectorAll('.project-directory') || [],
            ...this.completedProjectsList?.querySelectorAll('.project-directory') || []
        ];

        dirLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const path = link.dataset.path;
                if (!path) return;
                try {
                    // Call the Go backend method exposed by Wails
                    if (window.go && window.go.main && window.go.main.App && typeof window.go.main.App.OpenDirectory === 'function') {
                        await window.go.main.App.OpenDirectory(path);
                        return;
                    }
                } catch (err) {
                    console.error('Error calling OpenDirectory:', err);
                }

                // Fallback: try opening with runtime BrowserOpenURL using file:// scheme
                try {
                    Runtime.BrowserOpenURL('file://' + path);
                } catch (err) {
                    try { window.open('file://' + path); } catch (e) { /* ignore */ }
                }
            });
        });
    }

    // Fetch total durations for visible projects and cache them
    async fetchProjectDurations(projects) {
        const promises = projects.map(async (p) => {
            try {
                const secs = await API.getTotalDurationByProject(p.id);
                this.projectDurations.set(p.id, secs || 0);
            } catch (err) {
                console.error('Error fetching duration for project', p.id, err);
                this.projectDurations.set(p.id, 0);
            }
        });

        await Promise.all(promises);
    }

    async handleProjectAction(action, id) {
        try {
            switch (action) {
                case 'edit':
                    await this.editProject(id);
                    break;
                case 'pause':
                    await this.updateProjectStatus(id, 'paused');
                    break;
                case 'resume':
                    await this.updateProjectStatus(id, 'active');
                    break;
                case 'complete':
                    await this.updateProjectStatus(id, 'completed');
                    break;
                case 'uncomplete':
                    await this.updateProjectStatus(id, 'active');
                    break;
                case 'delete':
                    await this.deleteProject(id);
                    break;
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            Utils.showNotification('Error', `Failed to ${action} project`, 'error');
        }
    }

    async editProject(id) {
        const project = this.projects.find(p => p.id === id);
        if (!project) return;

        this.currentEditingId = id;
        this.projectModalTitle.textContent = 'Edit Project';
        
        // Update icon for edit mode
        if (this.projectModalIcon) {
            this.projectModalIcon.className = 'standard-modal-icon project-edit';
            const iconElement = this.projectModalIcon.querySelector('i');
            if (iconElement) {
                iconElement.className = 'fas fa-edit';
            }
        }
        
        // Populate form
        this.nameField.value = project.name;
        this.descriptionField.value = project.description || '';
        this.urlField.value = project.url || '';
    this.directoryField.value = project.directory || '';
        this.deadlineField.value = project.deadline ? Utils.formatDateForInput(project.deadline) : '';
        
        this.openModal();
    }

    async updateProjectStatus(id, status) {
        const project = await API.updateProject(id, { status });
        await this.loadProjects();
        Utils.showNotification('Success', `Project ${status} successfully!`, 'success');
    }

    async deleteProject(id) {
        const confirmed = await Dialog.confirm(
            'Delete Project',
            'Are you sure you want to delete this project? This action cannot be undone and will delete all associated time blocks.',
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                confirmType: 'danger'
            }
        );

        if (!confirmed) return;

        await API.deleteProject(id);
        await this.loadProjects();
        Utils.showNotification('Success', 'Project deleted successfully!', 'success');
    }

    openModal() {
        this.projectModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.nameField.focus();
    }

    closeModal() {
        this.projectModal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditingId = null;
        this.projectForm.reset();
        this.projectModalTitle.textContent = 'Add Project';
        
        // Reset icon to add mode
        if (this.projectModalIcon) {
            this.projectModalIcon.className = 'standard-modal-icon project';
            const iconElement = this.projectModalIcon.querySelector('i');
            if (iconElement) {
                iconElement.className = 'fas fa-folder-plus';
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.projectForm);

        // Handle URL: when updating we must send an explicit empty string
        // so the backend receives a non-nil value and will clear the column.
        const rawUrl = formData.get('url');
        let urlValue = null;
        if (this.currentEditingId) {
            // For updates, send empty string when the user cleared the field
            urlValue = rawUrl === null ? '' : rawUrl.trim();
        } else {
            // For creates, prefer null when empty
            urlValue = rawUrl && rawUrl.trim() !== '' ? rawUrl.trim() : null;
        }

        // Handle deadline: create a local-midnight Date to avoid UTC shifts
        const rawDeadline = formData.get('deadline');
        let deadlineValue = null;
        if (rawDeadline) {
            // rawDeadline may be YYYY-MM-DD or YYYY-MM-DDTHH:MM (for datetime-local)
            const datePart = String(rawDeadline).split('T')[0];
            const [y, m, d] = datePart.split('-').map(n => parseInt(n, 10));
            // Construct as local date midnight
            deadlineValue = new Date(y, (m || 1) - 1, d || 1);
        }

        // Handle Directory similar to URL: allow empty string on update to clear
        const rawDirectory = formData.get('directory');
        let directoryValue = null;
        if (this.currentEditingId) {
            directoryValue = rawDirectory === null ? '' : rawDirectory.trim();
        } else {
            directoryValue = rawDirectory && rawDirectory.trim() !== '' ? rawDirectory.trim() : null;
        }

        const projectData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim() || null,
            url: urlValue,
            directory: directoryValue,
            deadline: deadlineValue
        };

        // Validation
        if (!projectData.name) {
            Utils.showNotification('Error', 'Project name is required', 'error');
            return;
        }

        // Validate URL only when non-empty ('' should be allowed to clear the URL)
        if (projectData.url && projectData.url.length > 0 && !Utils.isValidURL(projectData.url)) {
            Utils.showNotification('Error', 'Please enter a valid URL', 'error');
            return;
        }

        try {
            if (this.currentEditingId) {
                // Update existing project
                await API.updateProject(this.currentEditingId, projectData);
                Utils.showNotification('Success', 'Project updated successfully!', 'success');
            } else {
                // Create new project
                await API.createProject(projectData);
                Utils.showNotification('Success', 'Project created successfully!', 'success');
            }

            this.closeModal();
            await this.loadProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            Utils.showNotification('Error', 'Failed to save project', 'error');
        }
    }

    updateProjectSelectors() {
        // Update project selectors in timer and timeblock forms
        const selectors = [
            document.getElementById('project-selector'),
            document.getElementById('timeblock-project')
        ];

        selectors.forEach(selector => {
            if (selector) {
                const currentValue = selector.value;
                selector.innerHTML = '<option value="">Select a project...</option>';
                
                this.projects
                    .filter(project => project.status === 'active')
                    .forEach(project => {
                        const option = document.createElement('option');
                        option.value = project.id;
                        option.textContent = project.name;
                        // Store the project url and directory on the option for quick access from other modules
                        if (project.url) option.setAttribute('data-url', project.url);
                        else option.removeAttribute('data-url');

                        if (project.directory) option.setAttribute('data-directory', project.directory);
                        else option.removeAttribute('data-directory');
                        selector.appendChild(option);
                    });
                
                // Restore previous selection if it still exists
                if (currentValue && selector.querySelector(`option[value="${currentValue}"]`)) {
                    selector.value = currentValue;
                }
            }
        });
    }

    getProjects() {
        return this.projects;
    }

    getActiveProjects() {
        return this.projects.filter(project => project.status === 'active');
    }

    getProjectById(id) {
        return this.projects.find(project => project.id === id);
    }
}

export default Projects;
