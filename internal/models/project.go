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
	URL1        *string       `json:"url1" db:"url1"`
	URL2        *string       `json:"url2" db:"url2"`
	URL3        *string       `json:"url3" db:"url3"`
	Discord     *string       `json:"discord" db:"discord"`
	Directory   *string       `json:"directory" db:"directory"`
	Deadline    *time.Time    `json:"deadline" db:"deadline"`
	Status      ProjectStatus `json:"status" db:"status"`
	Order       int           `json:"order" db:"order"`
	CreatedAt   time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at" db:"updated_at"`
}

// CreateProjectRequest represents the request to create a new project
type CreateProjectRequest struct {
	Name        string     `json:"name"`
	Description *string    `json:"description"`
	URL1        *string    `json:"url1"`
	URL2        *string    `json:"url2"`
	URL3        *string    `json:"url3"`
	Discord     *string    `json:"discord"`
	Directory   *string    `json:"directory"`
	Deadline    *time.Time `json:"deadline"`
	Order       int        `json:"order"`
}

// UpdateProjectRequest represents the request to update a project
type UpdateProjectRequest struct {
	Name        *string        `json:"name"`
	Description *string        `json:"description"`
	URL1        *string        `json:"url1"`
	URL2        *string        `json:"url2"`
	URL3        *string        `json:"url3"`
	Discord     *string        `json:"discord"`
	Directory   *string        `json:"directory"`
	Deadline    *time.Time     `json:"deadline"`
	Status      *ProjectStatus `json:"status"`
	Order       *int           `json:"order"`
}
