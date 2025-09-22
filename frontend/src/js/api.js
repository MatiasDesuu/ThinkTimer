// API Module - Handles all backend API calls
class API {
    static async createProject(projectData) {
        try {
            return await window.go.main.App.CreateProject(projectData);
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    static async getAllProjects() {
        try {
            return await window.go.main.App.GetAllProjects();
        } catch (error) {
            console.error('Error getting projects:', error);
            throw error;
        }
    }

    static async getProjectByID(id) {
        try {
            return await window.go.main.App.GetProjectByID(id);
        } catch (error) {
            console.error('Error getting project:', error);
            throw error;
        }
    }

    static async updateProject(id, projectData) {
        try {
            return await window.go.main.App.UpdateProject(id, projectData);
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }

    static async deleteProject(id) {
        try {
            return await window.go.main.App.DeleteProject(id);
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }

    static async createTimeBlock(timeBlockData) {
        try {
            return await window.go.main.App.CreateTimeBlock(timeBlockData);
        } catch (error) {
            console.error('Error creating time block:', error);
            throw error;
        }
    }

    static async getTimeBlocksByDate(date) {
        try {
            return await window.go.main.App.GetTimeBlocksByDate(date);
        } catch (error) {
            console.error('Error getting time blocks:', error);
            throw error;
        }
    }

    static async getTimeBlocksByDateRange(startDate, endDate) {
        try {
            return await window.go.main.App.GetTimeBlocksByDateRange(startDate, endDate);
        } catch (error) {
            console.error('Error getting time blocks by range:', error);
            throw error;
        }
    }

    static async getTotalDurationByProject(projectID) {
        try {
            return await window.go.main.App.GetTotalDurationByProject(projectID);
        } catch (error) {
            console.error('Error getting total duration by project:', error);
            throw error;
        }
    }

    static async updateTimeBlock(id, timeBlockData) {
        try {
            return await window.go.main.App.UpdateTimeBlock(id, timeBlockData);
        } catch (error) {
            console.error('Error updating time block:', error);
            throw error;
        }
    }

    static async deleteTimeBlock(id) {
        try {
            const result = await window.go.main.App.DeleteTimeBlock(parseInt(id));
            return result;
        } catch (error) {
            console.error('API Error deleting time block:', error);
            throw error;
        }
    }

    static async stopRunningTimeBlock(id) {
        try {
            return await window.go.main.App.StopRunningTimeBlock(id);
        } catch (error) {
            console.error('Error stopping time block:', error);
            throw error;
        }
    }

    static async stopTimeBlockWithDuration(id, duration) {
        try {
            return await window.go.main.App.StopTimeBlockWithDuration(id, duration);
        } catch (error) {
            console.error('Error stopping time block with duration:', error);
            throw error;
        }
    }

    static async getSettings() {
        try {
            return await window.go.main.App.GetSettings();
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    }

    static async updateSettings(settingsData) {
        try {
            return await window.go.main.App.UpdateSettings(settingsData);
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }
}

export default API;
