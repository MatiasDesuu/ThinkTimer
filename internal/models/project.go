package models

import (
	"time"
)

// ProjectStatus represents the status of a project
type ProjectStatus string

const (
	StatusActive    ProjectStatus = "active"
	StatusCompleted ProjectStatus = "completed"
	StatusPaused    ProjectStatus = "paused"
)

// Project represents a work project
type Project struct {
	ID          int           `json:"id" db:"id"`
	Name        string        `json:"name" db:"name"`
	Description *string       `json:"description" db:"description"`
	URL         *string       `json:"url" db:"url"`
	Discord     *string       `json:"discord" db:"discord"`
	Directory   *string       `json:"directory" db:"directory"`
	Deadline    *time.Time    `json:"deadline" db:"deadline"`
	Status      ProjectStatus `json:"status" db:"status"`
	CreatedAt   time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at" db:"updated_at"`
}

// CreateProjectRequest represents the request to create a new project
type CreateProjectRequest struct {
	Name        string     `json:"name"`
	Description *string    `json:"description"`
	URL         *string    `json:"url"`
	Discord     *string    `json:"discord"`
	Directory   *string    `json:"directory"`
	Deadline    *time.Time `json:"deadline"`
}

// UpdateProjectRequest represents the request to update a project
type UpdateProjectRequest struct {
	Name        *string        `json:"name"`
	Description *string        `json:"description"`
	URL         *string        `json:"url"`
	Discord     *string        `json:"discord"`
	Directory   *string        `json:"directory"`
	Deadline    *time.Time     `json:"deadline"`
	Status      *ProjectStatus `json:"status"`
}
