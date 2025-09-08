package services

import (
	"database/sql"

	"ThinkTimerV2/internal/models"
)

// SettingsService handles settings operations
type SettingsService struct {
	db *sql.DB
}

// NewSettingsService creates a new settings service
func NewSettingsService(db *sql.DB) *SettingsService {
	return &SettingsService{db: db}
}

// GetSettings returns the current settings
func (s *SettingsService) GetSettings() (*models.Settings, error) {
	query := "SELECT id, theme, language, COALESCE(timeformat, '24'), COALESCE(custom_url, '') FROM settings WHERE id = 1"

	var settings models.Settings
	err := s.db.QueryRow(query).Scan(&settings.ID, &settings.Theme, &settings.Language, &settings.TimeFormat, &settings.CustomURL)
	if err != nil {
		return nil, err
	}

	return &settings, nil
}

// UpdateSettings updates the settings
func (s *SettingsService) UpdateSettings(req models.UpdateSettingsRequest) (*models.Settings, error) {
	setParts := []string{}
	args := []interface{}{}

	if req.Theme != nil {
		setParts = append(setParts, "theme = ?")
		args = append(args, *req.Theme)
	}
	if req.Language != nil {
		setParts = append(setParts, "language = ?")
		args = append(args, *req.Language)
	}
	if req.TimeFormat != nil {
		setParts = append(setParts, "timeformat = ?")
		args = append(args, *req.TimeFormat)
	}
	if req.CustomURL != nil {
		setParts = append(setParts, "custom_url = ?")
		args = append(args, *req.CustomURL)
	}

	if len(setParts) > 0 {
		args = append(args, 1) // settings ID is always 1

		query := "UPDATE settings SET " + setParts[0]
		for i := 1; i < len(setParts); i++ {
			query += ", " + setParts[i]
		}
		query += " WHERE id = ?"

		_, err := s.db.Exec(query, args...)
		if err != nil {
			return nil, err
		}
	}

	return s.GetSettings()
}
