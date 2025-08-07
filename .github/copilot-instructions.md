<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# ThinkTimer - Time Tracking Application

This is a time tracking application built with GO + Wails and vanilla HTML/CSS/JavaScript.

## Architecture

### Backend (Go)
- **Framework**: Wails v2 for desktop application framework
- **Database**: SQLite3 for local data storage
- **Structure**: Clean architecture with models, services, and database layers
- **Key Components**:
  - `internal/models/`: Data models for Project, TimeBlock, and Settings
  - `internal/services/`: Business logic for project and time management
  - `internal/database/`: Database connection and migrations
  - `app.go`: Main application struct with API methods

### Frontend (Vanilla JavaScript)
- **Structure**: Modular ES6 modules for each feature
- **Styling**: CSS with CSS custom properties for theming
- **Key Components**:
  - `js/timer.js`: Timer functionality and time tracking
  - `js/projects.js`: Project management
  - `js/timeblocks.js`: Time block management
  - `js/calendar.js`: Calendar view and navigation
  - `js/settings.js`: Application settings and theme management
  - `js/utils.js`: Utility functions
  - `js/api.js`: API communication with backend

## Design Principles
- **Minimalist UI**: Clean, modern design inspired by Notion/Obsidian
- **Light/Dark Theme**: Fully responsive theme system
- **Responsive Design**: Works on different screen sizes
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Font Awesome Icons**: Consistent iconography throughout

## Development Guidelines
- Follow ES6+ JavaScript standards
- Use semantic HTML and CSS Grid/Flexbox for layouts
- Maintain clean separation between modules
- Use async/await for asynchronous operations
- Implement proper error handling and user feedback
- Keep CSS organized with CSS custom properties for theming

## API Communication
All frontend-backend communication happens through Wails bindings:
- Use `window.go.main.App.*` methods to call backend functions
- All API calls return promises
- Proper error handling with try/catch blocks

## Database Schema
- **projects**: Project information with status tracking
- **time_blocks**: Time tracking entries linked to projects
- **settings**: Application configuration

When working on this project, maintain the existing architecture and follow the established patterns for consistency.
