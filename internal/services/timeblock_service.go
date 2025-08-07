package services

import (
	"database/sql"
	"time"

	"ThinkTimerV2/internal/models"
)

// TimeBlockService handles time block operations
type TimeBlockService struct {
	db *sql.DB
}

// NewTimeBlockService creates a new time block service
func NewTimeBlockService(db *sql.DB) *TimeBlockService {
	return &TimeBlockService{db: db}
}

// CreateTimeBlock creates a new time block
func (s *TimeBlockService) CreateTimeBlock(req models.CreateTimeBlockRequest) (*models.TimeBlock, error) {
	query := `
		INSERT INTO time_blocks (project_id, start_time, end_time, duration, is_manual, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		RETURNING id
	`

	now := time.Now()

	var id int
	err := s.db.QueryRow(query, req.ProjectID, req.StartTime, req.EndTime, req.Duration, req.IsManual, req.Description, now, now).Scan(&id)
	if err != nil {
		return nil, err
	}

	return s.GetTimeBlockByID(id)
}

// GetTimeBlockByID returns a time block by ID
func (s *TimeBlockService) GetTimeBlockByID(id int) (*models.TimeBlock, error) {
	query := `
		SELECT tb.id, tb.project_id, p.name as project_name, tb.start_time, tb.end_time, 
		       tb.duration, tb.is_manual, tb.description, tb.created_at, tb.updated_at
		FROM time_blocks tb
		JOIN projects p ON tb.project_id = p.id
		WHERE tb.id = ?
	`

	var timeBlock models.TimeBlock
	err := s.db.QueryRow(query, id).Scan(
		&timeBlock.ID, &timeBlock.ProjectID, &timeBlock.ProjectName, &timeBlock.StartTime,
		&timeBlock.EndTime, &timeBlock.Duration, &timeBlock.IsManual, &timeBlock.Description,
		&timeBlock.CreatedAt, &timeBlock.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &timeBlock, nil
}

// GetTimeBlocksByDate returns time blocks for a specific date
func (s *TimeBlockService) GetTimeBlocksByDate(date time.Time) ([]models.TimeBlock, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	query := `
		SELECT tb.id, tb.project_id, p.name as project_name, tb.start_time, tb.end_time, 
		       tb.duration, tb.is_manual, tb.description, tb.created_at, tb.updated_at
		FROM time_blocks tb
		JOIN projects p ON tb.project_id = p.id
		WHERE tb.start_time >= ? AND tb.start_time < ?
		ORDER BY tb.start_time DESC
	`

	rows, err := s.db.Query(query, startOfDay, endOfDay)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var timeBlocks []models.TimeBlock
	for rows.Next() {
		var timeBlock models.TimeBlock
		err := rows.Scan(
			&timeBlock.ID, &timeBlock.ProjectID, &timeBlock.ProjectName, &timeBlock.StartTime,
			&timeBlock.EndTime, &timeBlock.Duration, &timeBlock.IsManual, &timeBlock.Description,
			&timeBlock.CreatedAt, &timeBlock.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		timeBlocks = append(timeBlocks, timeBlock)
	}

	return timeBlocks, nil
}

// GetTimeBlocksByDateRange returns time blocks for a date range
func (s *TimeBlockService) GetTimeBlocksByDateRange(startDate, endDate time.Time) ([]models.TimeBlock, error) {
	query := `
		SELECT tb.id, tb.project_id, p.name as project_name, tb.start_time, tb.end_time, 
		       tb.duration, tb.is_manual, tb.description, tb.created_at, tb.updated_at
		FROM time_blocks tb
		JOIN projects p ON tb.project_id = p.id
		WHERE tb.start_time >= ? AND tb.start_time <= ?
		ORDER BY tb.start_time DESC
	`

	rows, err := s.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var timeBlocks []models.TimeBlock
	for rows.Next() {
		var timeBlock models.TimeBlock
		err := rows.Scan(
			&timeBlock.ID, &timeBlock.ProjectID, &timeBlock.ProjectName, &timeBlock.StartTime,
			&timeBlock.EndTime, &timeBlock.Duration, &timeBlock.IsManual, &timeBlock.Description,
			&timeBlock.CreatedAt, &timeBlock.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		timeBlocks = append(timeBlocks, timeBlock)
	}

	return timeBlocks, nil
}

// UpdateTimeBlock updates a time block
func (s *TimeBlockService) UpdateTimeBlock(id int, req models.UpdateTimeBlockRequest) (*models.TimeBlock, error) {
	setParts := []string{}
	args := []interface{}{}

	if req.StartTime != nil {
		setParts = append(setParts, "start_time = ?")
		args = append(args, *req.StartTime)
	}
	if req.EndTime != nil {
		setParts = append(setParts, "end_time = ?")
		args = append(args, *req.EndTime)
	}
	if req.Duration != nil {
		setParts = append(setParts, "duration = ?")
		args = append(args, *req.Duration)
	}
	if req.Description != nil {
		setParts = append(setParts, "description = ?")
		args = append(args, *req.Description)
	}

	setParts = append(setParts, "updated_at = ?")
	args = append(args, time.Now())
	args = append(args, id)

	query := "UPDATE time_blocks SET " + setParts[0]
	for i := 1; i < len(setParts); i++ {
		query += ", " + setParts[i]
	}
	query += " WHERE id = ?"

	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	return s.GetTimeBlockByID(id)
}

// DeleteTimeBlock deletes a time block
func (s *TimeBlockService) DeleteTimeBlock(id int) error {
	query := "DELETE FROM time_blocks WHERE id = ?"
	_, err := s.db.Exec(query, id)
	return err
}

// GetTimeBlocksByDateString returns time blocks for a specific date string
func (s *TimeBlockService) GetTimeBlocksByDateString(dateStr string) ([]models.TimeBlock, error) {
	date, err := time.Parse("2006-01-02T15:04:05Z07:00", dateStr)
	if err != nil {
		// Try alternative format
		date, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, err
		}
	}
	return s.GetTimeBlocksByDate(date)
}

// GetTimeBlocksByDateRangeString returns time blocks for a date range using strings
func (s *TimeBlockService) GetTimeBlocksByDateRangeString(startDateStr, endDateStr string) ([]models.TimeBlock, error) {
	startDate, err := time.Parse("2006-01-02T15:04:05Z07:00", startDateStr)
	if err != nil {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			return nil, err
		}
	}

	endDate, err := time.Parse("2006-01-02T15:04:05Z07:00", endDateStr)
	if err != nil {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			return nil, err
		}
	}

	return s.GetTimeBlocksByDateRange(startDate, endDate)
}

// StopRunningTimeBlock stops a running time block by setting end time and calculating duration
func (s *TimeBlockService) StopRunningTimeBlock(id int) (*models.TimeBlock, error) {
	endTime := time.Now()

	// Get the current time block to calculate duration
	timeBlock, err := s.GetTimeBlockByID(id)
	if err != nil {
		return nil, err
	}

	duration := int(endTime.Sub(timeBlock.StartTime).Seconds())

	query := "UPDATE time_blocks SET end_time = ?, duration = ?, updated_at = ? WHERE id = ?"
	_, err = s.db.Exec(query, endTime, duration, time.Now(), id)
	if err != nil {
		return nil, err
	}

	return s.GetTimeBlockByID(id)
}

// StopTimeBlockWithDuration stops a time block with a specific duration (used for paused timers)
func (s *TimeBlockService) StopTimeBlockWithDuration(id int, duration int) (*models.TimeBlock, error) {
	endTime := time.Now()

	query := "UPDATE time_blocks SET end_time = ?, duration = ?, updated_at = ? WHERE id = ?"
	_, err := s.db.Exec(query, endTime, duration, time.Now(), id)
	if err != nil {
		return nil, err
	}

	return s.GetTimeBlockByID(id)
}
