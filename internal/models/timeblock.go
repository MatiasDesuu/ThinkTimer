package models

import (
	"time"
)

// TimeBlock represents a time tracking block
type TimeBlock struct {
	ID          int        `json:"id" db:"id"`
	ProjectID   int        `json:"project_id" db:"project_id"`
	ProjectName string     `json:"project_name" db:"project_name"`
	StartTime   time.Time  `json:"start_time" db:"start_time"`
	EndTime     *time.Time `json:"end_time" db:"end_time"`
	Duration    int        `json:"duration" db:"duration"` // Duration in seconds
	IsManual    bool       `json:"is_manual" db:"is_manual"`
	Description *string    `json:"description" db:"description"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// CreateTimeBlockRequest represents the request to create a new time block
type CreateTimeBlockRequest struct {
	ProjectID   int        `json:"project_id"`
	StartTime   time.Time  `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Duration    int        `json:"duration"`
	IsManual    bool       `json:"is_manual"`
	Description *string    `json:"description"`
}

// UpdateTimeBlockRequest represents the request to update a time block
type UpdateTimeBlockRequest struct {
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Duration    *int       `json:"duration"`
	Description *string    `json:"description"`
}
