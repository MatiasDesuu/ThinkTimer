package database

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// DB holds the database connection
type DB struct {
	conn *sql.DB
}

// New creates a new database connection
func New() (*DB, error) {
	// Get the executable directory
	exePath, err := os.Executable()
	if err != nil {
		return nil, err
	}

	dbPath := filepath.Join(filepath.Dir(exePath), "thinktimer.db")

	// Create database connection
	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	db := &DB{conn: conn}

	// Run migrations
	if err := db.migrate(); err != nil {
		return nil, err
	}

	return db, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}

// GetConnection returns the database connection
func (db *DB) GetConnection() *sql.DB {
	return db.conn
}

// migrate runs the database migrations
func (db *DB) migrate() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS projects (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			description TEXT,
			url1 TEXT,
			url2 TEXT,
			url3 TEXT,
			discord TEXT,
			directory TEXT,
			deadline DATETIME,
			status TEXT DEFAULT 'active',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS time_blocks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL,
			start_time DATETIME NOT NULL,
			end_time DATETIME,
			duration INTEGER DEFAULT 0,
			is_manual BOOLEAN DEFAULT FALSE,
			description TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS settings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			theme TEXT DEFAULT 'light',
			language TEXT DEFAULT 'en',
			timeformat TEXT DEFAULT '24'
		)`,
		`INSERT OR IGNORE INTO settings (id, theme, language, timeformat) VALUES (1, 'light', 'en', '24')`,
	}

	for _, query := range queries {
		if _, err := db.conn.Exec(query); err != nil {
			return err
		}
	}

	// Handle timeformat column migration safely
	if err := db.addTimeFormatColumn(); err != nil {
		return err
	}

	// Handle custom_url column migration safely
	if err := db.addCustomURLColumn(); err != nil {
		return err
	}

	// Handle trello_url column migration safely
	if err := db.addTrelloURLColumn(); err != nil {
		return err
	}

	// Handle discord column migration for projects
	if err := db.addProjectDiscordColumn(); err != nil {
		return err
	}

	// Handle directory column migration for projects
	if err := db.addProjectDirectoryColumn(); err != nil {
		return err
	}

	// Handle order column migration for projects
	if err := db.addProjectOrderColumn(); err != nil {
		return err
	}

	// Handle url to url1, and add url2, url3 migrations
	if err := db.addProjectURLsColumns(); err != nil {
		return err
	}

	return nil
}

// addProjectDirectoryColumn adds the directory column to projects if it doesn't exist
func (db *DB) addProjectDirectoryColumn() error {
	query := "PRAGMA table_info(projects)"
	rows, err := db.conn.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	hasDirectory := false
	for rows.Next() {
		var cid int
		var name, dataType string
		var notNull, dfltValue, pk interface{}

		if err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &pk); err != nil {
			continue
		}

		if name == "directory" {
			hasDirectory = true
			break
		}
	}

	if !hasDirectory {
		_, err := db.conn.Exec("ALTER TABLE projects ADD COLUMN directory TEXT DEFAULT ''")
		if err != nil {
			return err
		}
		// No further update needed; default empty string is fine
	}

	return nil
}

// addTimeFormatColumn adds the timeformat column if it doesn't exist
func (db *DB) addTimeFormatColumn() error {
	// Check if timeformat column exists
	query := "PRAGMA table_info(settings)"
	rows, err := db.conn.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	hasTimeFormat := false
	for rows.Next() {
		var cid int
		var name, dataType string
		var notNull, dfltValue, pk interface{}

		if err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &pk); err != nil {
			continue
		}

		if name == "timeformat" {
			hasTimeFormat = true
			break
		}
	}

	// Add column if it doesn't exist
	if !hasTimeFormat {
		_, err := db.conn.Exec("ALTER TABLE settings ADD COLUMN timeformat TEXT DEFAULT '24'")
		if err != nil {
			return err
		}

		// Update existing record to have timeformat
		_, err = db.conn.Exec("UPDATE settings SET timeformat = '24' WHERE id = 1 AND timeformat IS NULL")
		if err != nil {
			return err
		}
	}

	return nil
}

// addProjectURLsColumns handles transitioning from 'url' to 'url1', 'url2', 'url3'
func (db *DB) addProjectURLsColumns() error {
	query := "PRAGMA table_info(projects)"
	rows, err := db.conn.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	hasURL := false
	hasURL1 := false
	hasURL2 := false
	hasURL3 := false

	for rows.Next() {
		var cid int
		var name, dataType string
		var notNull, dfltValue, pk interface{}

		if err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &pk); err != nil {
			continue
		}

		switch name {
		case "url":
			hasURL = true
		case "url1":
			hasURL1 = true
		case "url2":
			hasURL2 = true
		case "url3":
			hasURL3 = true
		}
	}

	// Rename 'url' to 'url1' if 'url' exists but 'url1' does not
	if hasURL && !hasURL1 {
		_, err := db.conn.Exec("ALTER TABLE projects RENAME COLUMN url TO url1")
		if err != nil {
			// If SQLite version < 3.25, RENAME COLUMN might fail. In that case, add url1 and update.
			_, errAdd := db.conn.Exec("ALTER TABLE projects ADD COLUMN url1 TEXT")
			if errAdd != nil {
				return errAdd
			}
			_, errUpd := db.conn.Exec("UPDATE projects SET url1 = url")
			if errUpd != nil {
				return errUpd
			}
		}
	} else if !hasURL1 && !hasURL {
		_, err := db.conn.Exec("ALTER TABLE projects ADD COLUMN url1 TEXT")
		if err != nil {
			return err
		}
	}

	if !hasURL2 {
		_, err := db.conn.Exec("ALTER TABLE projects ADD COLUMN url2 TEXT")
		if err != nil {
			return err
		}
	}

	if !hasURL3 {
		_, err := db.conn.Exec("ALTER TABLE projects ADD COLUMN url3 TEXT")
		if err != nil {
			return err
		}
	}

	return nil
}

// addCustomURLColumn adds the custom_url column if it doesn't exist
func (db *DB) addCustomURLColumn() error {
	// Check if custom_url column exists
	query := "PRAGMA table_info(settings)"
	rows, err := db.conn.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	hasCustomURL := false
	for rows.Next() {
		var cid int
		var name, dataType string
		var notNull, dfltValue, pk interface{}

		if err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &pk); err != nil {
			continue
		}

		if name == "custom_url" {
			hasCustomURL = true
			break
		}
	}

	// Add column if it doesn't exist
	if !hasCustomURL {
		_, err := db.conn.Exec("ALTER TABLE settings ADD COLUMN custom_url TEXT DEFAULT ''")
		if err != nil {
			return err
		}

		// Update existing record to have empty custom_url
		_, err = db.conn.Exec("UPDATE settings SET custom_url = '' WHERE id = 1 AND custom_url IS NULL")
		if err != nil {
			return err
		}
	}

	return nil
}

// addTrelloURLColumn adds the trello_url column if it doesn't exist
func (db *DB) addTrelloURLColumn() error {
	// Check if trello_url column exists
	query := "PRAGMA table_info(settings)"
	rows, err := db.conn.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	hasTrelloURL := false
	for rows.Next() {
		var cid int
		var name, dataType string
		var notNull, dfltValue, pk interface{}

		if err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &pk); err != nil {
			continue
		}

		if name == "trello_url" {
			hasTrelloURL = true
			break
		}
	}

	// Add column if it doesn't exist
	if !hasTrelloURL {
		_, err := db.conn.Exec("ALTER TABLE settings ADD COLUMN trello_url TEXT DEFAULT ''")
		if err != nil {
			return err
		}

		// Update existing record to have empty trello_url
		_, err = db.conn.Exec("UPDATE settings SET trello_url = '' WHERE id = 1 AND trello_url IS NULL")
		if err != nil {
			return err
		}
	}

	return nil
}

// addProjectDiscordColumn adds the discord column to projects if it doesn't exist
func (db *DB) addProjectDiscordColumn() error {
	query := "PRAGMA table_info(projects)"
	rows, err := db.conn.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	hasDiscord := false
	for rows.Next() {
		var cid int
		var name, dataType string
		var notNull, dfltValue, pk interface{}

		if err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &pk); err != nil {
			continue
		}

		if name == "discord" {
			hasDiscord = true
			break
		}
	}

	if !hasDiscord {
		_, err := db.conn.Exec("ALTER TABLE projects ADD COLUMN discord TEXT DEFAULT ''")
		if err != nil {
			return err
		}
	}

	return nil
}

// addProjectOrderColumn adds the order column to projects if it doesn't exist
func (db *DB) addProjectOrderColumn() error {
	query := "PRAGMA table_info(projects)"
	rows, err := db.conn.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	hasOrder := false
	for rows.Next() {
		var cid int
		var name, dataType string
		var notNull, dfltValue, pk interface{}

		if err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &pk); err != nil {
			continue
		}

		if name == "order" {
			hasOrder = true
			break
		}
	}

	if !hasOrder {
		_, err := db.conn.Exec("ALTER TABLE projects ADD COLUMN \"order\" INTEGER DEFAULT 0")
		if err != nil {
			return err
		}
		// Update existing projects to have order based on created_at
		_, err = db.conn.Exec(`
			UPDATE projects 
			SET "order" = (
				SELECT COUNT(*) 
				FROM projects p2 
				WHERE p2.created_at <= projects.created_at
			) - 1
		`)
		if err != nil {
			return err
		}
	}

	return nil
}
