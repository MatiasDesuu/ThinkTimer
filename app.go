package main

import (
	"context"
	"time"

	"ThinkTimerV2/internal/database"
	"ThinkTimerV2/internal/models"
	"ThinkTimerV2/internal/services"
)

// App struct
type App struct {
	ctx              context.Context
	db               *database.DB
	projectService   *services.ProjectService
	timeBlockService *services.TimeBlockService
	settingsService  *services.SettingsService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize database
	db, err := database.New()
	if err != nil {
		// Log the error for debugging
		println("Database initialization error:", err.Error())
		panic(err)
	}
	a.db = db

	// Initialize services
	conn := db.GetConnection()
	a.projectService = services.NewProjectService(conn)
	a.timeBlockService = services.NewTimeBlockService(conn)
	a.settingsService = services.NewSettingsService(conn)
}

// Project API methods
func (a *App) CreateProject(req models.CreateProjectRequest) (*models.Project, error) {
	return a.projectService.CreateProject(req)
}

func (a *App) GetAllProjects() ([]models.Project, error) {
	return a.projectService.GetAllProjects()
}

func (a *App) GetProjectByID(id int) (*models.Project, error) {
	return a.projectService.GetProjectByID(id)
}

func (a *App) UpdateProject(id int, req models.UpdateProjectRequest) (*models.Project, error) {
	return a.projectService.UpdateProject(id, req)
}

func (a *App) DeleteProject(id int) error {
	return a.projectService.DeleteProject(id)
}

// Time Block API methods
func (a *App) CreateTimeBlock(req models.CreateTimeBlockRequest) (*models.TimeBlock, error) {
	return a.timeBlockService.CreateTimeBlock(req)
}

func (a *App) GetTimeBlocksByDate(date time.Time) ([]models.TimeBlock, error) {
	return a.timeBlockService.GetTimeBlocksByDate(date)
}

func (a *App) GetTimeBlocksByDateRange(startDate, endDate time.Time) ([]models.TimeBlock, error) {
	return a.timeBlockService.GetTimeBlocksByDateRange(startDate, endDate)
}

func (a *App) UpdateTimeBlock(id int, req models.UpdateTimeBlockRequest) (*models.TimeBlock, error) {
	return a.timeBlockService.UpdateTimeBlock(id, req)
}

func (a *App) DeleteTimeBlock(id int) error {
	return a.timeBlockService.DeleteTimeBlock(id)
}

func (a *App) StopRunningTimeBlock(id int) (*models.TimeBlock, error) {
	return a.timeBlockService.StopRunningTimeBlock(id)
}

func (a *App) StopTimeBlockWithDuration(id int, duration int) (*models.TimeBlock, error) {
	return a.timeBlockService.StopTimeBlockWithDuration(id, duration)
}

// Settings API methods
func (a *App) GetSettings() (*models.Settings, error) {
	return a.settingsService.GetSettings()
}

func (a *App) UpdateSettings(req models.UpdateSettingsRequest) (*models.Settings, error) {
	return a.settingsService.UpdateSettings(req)
}
