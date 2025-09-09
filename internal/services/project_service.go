package services

import (
	"database/sql"
	"time"

	"ThinkTimerV2/internal/models"
)

// ProjectService handles project operations
type ProjectService struct {
	db *sql.DB
}

// NewProjectService creates a new project service
func NewProjectService(db *sql.DB) *ProjectService {
	return &ProjectService{db: db}
}

// CreateProject creates a new project
func (s *ProjectService) CreateProject(req models.CreateProjectRequest) (*models.Project, error) {
	query := `
		INSERT INTO projects (name, description, url, directory, deadline, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		RETURNING id, name, description, url, directory, deadline, status, created_at, updated_at
	`

	now := time.Now()

	var project models.Project
	err := s.db.QueryRow(query, req.Name, req.Description, req.URL, req.Directory, req.Deadline, now, now).Scan(
		&project.ID, &project.Name, &project.Description, &project.URL, &project.Directory,
		&project.Deadline, &project.Status, &project.CreatedAt, &project.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

// GetAllProjects returns all projects
func (s *ProjectService) GetAllProjects() ([]models.Project, error) {
	query := `
		SELECT id, name, description, url, directory, deadline, status, created_at, updated_at
		FROM projects
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var project models.Project
		err := rows.Scan(
			&project.ID, &project.Name, &project.Description, &project.URL, &project.Directory,
			&project.Deadline, &project.Status, &project.CreatedAt, &project.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		projects = append(projects, project)
	}

	return projects, nil
}

// GetProjectByID returns a project by ID
func (s *ProjectService) GetProjectByID(id int) (*models.Project, error) {
	query := `
		SELECT id, name, description, url, directory, deadline, status, created_at, updated_at
		FROM projects
		WHERE id = ?
	`

	var project models.Project
	err := s.db.QueryRow(query, id).Scan(
		&project.ID, &project.Name, &project.Description, &project.URL, &project.Directory,
		&project.Deadline, &project.Status, &project.CreatedAt, &project.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

// UpdateProject updates a project
func (s *ProjectService) UpdateProject(id int, req models.UpdateProjectRequest) (*models.Project, error) {
	// Build dynamic query
	setParts := []string{}
	args := []interface{}{}

	if req.Name != nil {
		setParts = append(setParts, "name = ?")
		args = append(args, *req.Name)
	}
	if req.Description != nil {
		setParts = append(setParts, "description = ?")
		args = append(args, *req.Description)
	}
	if req.URL != nil {
		setParts = append(setParts, "url = ?")
		args = append(args, *req.URL)
	}
	if req.Directory != nil {
		setParts = append(setParts, "directory = ?")
		args = append(args, *req.Directory)
	}
	if req.Deadline != nil {
		setParts = append(setParts, "deadline = ?")
		args = append(args, *req.Deadline)
	}
	if req.Status != nil {
		setParts = append(setParts, "status = ?")
		args = append(args, *req.Status)
	}

	setParts = append(setParts, "updated_at = ?")
	args = append(args, time.Now())
	args = append(args, id)

	query := "UPDATE projects SET " + setParts[0]
	for i := 1; i < len(setParts); i++ {
		query += ", " + setParts[i]
	}
	query += " WHERE id = ?"

	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	return s.GetProjectByID(id)
}

// DeleteProject deletes a project
func (s *ProjectService) DeleteProject(id int) error {
	query := "DELETE FROM projects WHERE id = ?"
	_, err := s.db.Exec(query, id)
	return err
}
