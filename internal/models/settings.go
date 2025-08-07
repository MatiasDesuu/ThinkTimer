package models

// Settings represents application settings
type Settings struct {
	ID         int    `json:"id" db:"id"`
	Theme      string `json:"theme" db:"theme"` // "light" or "dark"
	Language   string `json:"language" db:"language"`
	TimeFormat string `json:"timeFormat" db:"timeformat"` // "12" or "24"
}

// UpdateSettingsRequest represents the request to update settings
type UpdateSettingsRequest struct {
	Theme      *string `json:"theme"`
	Language   *string `json:"language"`
	TimeFormat *string `json:"timeFormat"`
}
