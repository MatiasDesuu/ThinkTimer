package main

import (
	"context"
	"os/exec"
	"runtime"
	"time"

	"ThinkTimerV2/internal/database"
	"ThinkTimerV2/internal/models"
	"ThinkTimerV2/internal/services"
)

type App struct {
	ctx              context.Context
	db               *database.DB
	projectService   *services.ProjectService
	timeBlockService *services.TimeBlockService
	settingsService  *services.SettingsService
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	db, err := database.New()
	if err != nil {

		println("Database initialization error:", err.Error())
		panic(err)
	}
	a.db = db

	conn := db.GetConnection()
	a.projectService = services.NewProjectService(conn)
	a.timeBlockService = services.NewTimeBlockService(conn)
	a.settingsService = services.NewSettingsService(conn)
}

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

func (a *App) UpdateProjectsOrder(projectOrders map[int]int) error {
	return a.projectService.UpdateProjectsOrder(projectOrders)
}

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

func (a *App) GetTotalDurationByProject(projectID int) (int, error) {
	return a.timeBlockService.GetTotalDurationByProject(projectID)
}

func (a *App) GetSettings() (*models.Settings, error) {
	return a.settingsService.GetSettings()
}

func (a *App) UpdateSettings(req models.UpdateSettingsRequest) (*models.Settings, error) {
	return a.settingsService.UpdateSettings(req)
}

func (a *App) OpenDirectory(path string) error {
	if path == "" {
		return nil
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":

		cmd = exec.Command("cmd", "/c", "start", "", path)

		setHiddenWindow(cmd)
	case "darwin":
		cmd = exec.Command("open", path)
	default:

		cmd = exec.Command("xdg-open", path)
	}

	return cmd.Start()
}

func (a *App) OpenURL(url string) error {
	if url == "" {
		return nil
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":

		cmd = exec.Command("cmd", "/c", "start", "", url)

		setHiddenWindow(cmd)
	case "darwin":
		cmd = exec.Command("open", url)
	default:

		cmd = exec.Command("xdg-open", url)
	}

	return cmd.Start()
}
