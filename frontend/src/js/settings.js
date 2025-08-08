// Settings Module - Handles application settings
import API from './api.js';
import Utils from './utils.js';

class Settings {
    constructor() {
        this.settings = {
            theme: 'light',
            language: 'en',
            timeFormat: '24'
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
    }

    initializeElements() {
        this.themeSelector = document.getElementById('theme-selector');
        this.timeFormatSelector = document.getElementById('time-format-selector');
    }

    bindEvents() {
        this.themeSelector?.addEventListener('change', (e) => {
            this.updateTheme(e.target.value);
        });
        
        this.timeFormatSelector?.addEventListener('change', (e) => {
            this.updateTimeFormat(e.target.value);
        });
    }

    async loadSettings() {
        try {
            const settings = await API.getSettings();
            if (settings) {
                this.settings = settings;
                this.applySettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Use default settings
            this.applySettings();
        }
    }

    applySettings() {
        // Apply theme
        this.setTheme(this.settings.theme);
        
        // Update UI elements
        if (this.themeSelector) {
            this.themeSelector.value = this.settings.theme;
        }
        
        if (this.timeFormatSelector) {
            this.timeFormatSelector.value = this.settings.timeFormat || '24';
        }
    }

    async updateTheme(theme) {
        try {
            // Update local settings
            this.settings.theme = theme;
            
            // Save to backend
            await API.updateSettings({ theme });
            
            // Apply theme
            this.setTheme(theme);
            
            Utils.showNotification('Success', 'Theme updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating theme:', error);
            Utils.showNotification('Error', 'Failed to update theme', 'error');
        }
    }

    setTheme(theme) {
        // Remove existing theme
        document.documentElement.removeAttribute('data-theme');
        
        // Apply new theme
        document.documentElement.setAttribute('data-theme', theme);
        
        // Store in localStorage for persistence
        localStorage.setItem('theme', theme);
    }

    async updateLanguage(language) {
        try {
            // Update local settings
            this.settings.language = language;
            
            // Save to backend
            await API.updateSettings({ language });
            
            Utils.showNotification('Success', 'Language updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating language:', error);
            Utils.showNotification('Error', 'Failed to update language', 'error');
        }
    }

    async updateTimeFormat(timeFormat) {
        try {
            // Update local settings
            this.settings.timeFormat = timeFormat;
            
            // Save to backend
            await API.updateSettings({ timeFormat });
            
            // Dispatch event to update all time displays
            window.dispatchEvent(new CustomEvent('timeFormatChanged', { 
                detail: { timeFormat } 
            }));
            
            Utils.showNotification('Success', 'Time format updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating time format:', error);
            Utils.showNotification('Error', 'Failed to update time format', 'error');
        }
    }
    
    // Format time according to user preference
    formatTime(date, includeSeconds = false) {
        if (!date) return '';
        
        const timeFormat = this.settings.timeFormat || '24';
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: timeFormat === '12'
        };
        
        if (includeSeconds) {
            options.second = '2-digit';
        }
        
        return date.toLocaleTimeString([], options);
    }

    // Initialize theme from localStorage on app start
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || this.settings.theme || 'light';
        this.settings.theme = savedTheme;
        this.setTheme(savedTheme);
    }

    // Get current settings
    getSettings() {
        return this.settings;
    }

    // Export settings
    exportSettings() {
        const settingsData = {
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(settingsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `thinktimer-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        Utils.showNotification('Success', 'Settings exported successfully!', 'success');
    }

    // Import settings
    importSettings(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const settingsData = JSON.parse(e.target.result);
                    
                    if (settingsData.settings) {
                        // Validate settings structure
                        const validThemes = ['light', 'dark'];
                        const validLanguages = ['en'];
                        
                        if (validThemes.includes(settingsData.settings.theme)) {
                            await this.updateTheme(settingsData.settings.theme);
                        }
                        
                        if (validLanguages.includes(settingsData.settings.language)) {
                            await this.updateLanguage(settingsData.settings.language);
                        }
                        
                        Utils.showNotification('Success', 'Settings imported successfully!', 'success');
                        resolve();
                    } else {
                        throw new Error('Invalid settings file format');
                    }
                } catch (error) {
                    console.error('Error importing settings:', error);
                    Utils.showNotification('Error', 'Failed to import settings', 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                Utils.showNotification('Error', 'Failed to read settings file', 'error');
                reject(new Error('File read error'));
            };
            
            reader.readAsText(file);
        });
    }

    // Reset settings to defaults
    async resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
            return;
        }

        try {
            const defaultSettings = {
                theme: 'light',
                language: 'en'
            };

            await API.updateSettings(defaultSettings);
            this.settings = defaultSettings;
            this.applySettings();
            
            Utils.showNotification('Success', 'Settings reset to defaults!', 'success');
        } catch (error) {
            console.error('Error resetting settings:', error);
            Utils.showNotification('Error', 'Failed to reset settings', 'error');
        }
    }

    // Toggle theme (for keyboard shortcut)
    toggleTheme() {
        const newTheme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.updateTheme(newTheme);
    }

    // Get system theme preference
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Auto-detect theme based on system preference
    autoDetectTheme() {
        const systemTheme = this.getSystemTheme();
        this.updateTheme(systemTheme);
    }

    // Watch for system theme changes
    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                if (this.settings.theme === 'auto') {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            };
            
            // For newer browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
            } else {
                // For older browsers
                mediaQuery.addListener(handleChange);
            }
        }
    }
}

// Create and export global instance
const settingsInstance = new Settings();
export default settingsInstance;
