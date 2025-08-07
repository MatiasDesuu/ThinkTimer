# README

## ThinkTimer

A modern, lightweight time tracking application built with GO + Wails and vanilla HTML/CSS/JavaScript.

## Features

### 🎯 Core Functionality
- **Project Management**: Create, edit, and manage projects with optional descriptions, URLs, and deadlines
- **Time Tracking**: Start, pause, and reset timers with automatic time block creation
- **Manual Time Blocks**: Add time blocks manually for work done offline
- **Calendar View**: Visual calendar showing project deadlines and work history
- **Dark/Light Themes**: Switch between modern light and dark themes

### 🖥️ User Interface
- **4 Main Screens**: Home, Projects, Calendar, and Settings
- **Responsive Design**: Works on different screen sizes
- **Minimalist Design**: Clean, modern UI inspired by Notion/Obsidian
- **Font Awesome Icons**: Consistent iconography throughout
- **Keyboard Shortcuts**: Full keyboard navigation support

### 📊 Time Management
- **Real-time Timer**: Live timer with visual feedback
- **Project Selection**: Choose active project before starting timer
- **Time Block History**: View all time blocks for any given day
- **Date Navigation**: Browse time blocks by date
- **Running Timer Indicator**: Visual indication of active timers

## Technology Stack

### Backend
- **GO**: Core application logic
- **Wails v2**: Desktop application framework
- **SQLite3**: Local database for data persistence
- **Clean Architecture**: Organized code structure with models, services, and database layers

### Frontend
- **Vanilla JavaScript**: Modern ES6+ modules
- **HTML/CSS**: Semantic markup with CSS Grid and Flexbox
- **CSS Custom Properties**: Dynamic theming system
- **Font Awesome**: Icon library

## Project Structure

```
ThinkTimerV2/
├── internal/
│   ├── database/          # Database connection and migrations
│   ├── models/           # Data models (Project, TimeBlock, Settings)
│   └── services/         # Business logic services
├── frontend/
│   ├── src/
│   │   ├── js/          # JavaScript modules
│   │   └── styles/      # CSS stylesheets
│   └── index.html       # Main HTML file
├── app.go               # Main application struct
├── main.go              # Application entry point
└── wails.json           # Wails configuration
```

## Getting Started

### Prerequisites
- GO 1.19 or later
- Node.js 16 or later
- Wails CLI v2

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Development
Run in development mode with hot reload:
```bash
wails dev
```

### Building
Build the application for production:
```bash
wails build
```

The executable will be created in `build/bin/ThinkTimer.exe`

## Usage

### Basic Workflow
1. **Create Projects**: Go to Projects tab and add your work projects
2. **Start Timer**: On Home tab, select a project and click Start
3. **Track Time**: Timer runs in background, creating time blocks automatically
4. **Review Work**: View time blocks by date or in calendar view
5. **Manage Settings**: Customize theme and other preferences

### Keyboard Shortcuts
- `Ctrl/Cmd + 1-4`: Navigate between tabs
- `Ctrl/Cmd + N`: New project (on Projects tab)
- `Ctrl/Cmd + T`: Toggle theme
- `Space`: Start/Pause timer (on Home tab)
- `Escape`: Reset timer (on Home tab)

### Project Management
- **Status Tracking**: Projects can be Active, Paused, or Completed
- **Deadlines**: Set optional deadlines visible in calendar view
- **URLs**: Store project-related links
- **Descriptions**: Add detailed project information

### Time Tracking
- **Automatic Blocks**: Timer creates time blocks automatically
- **Manual Entry**: Add time blocks manually for offline work
- **Editing**: Modify existing time blocks as needed
- **Daily View**: See all work for specific days

## Database

ThinkTimer uses SQLite3 database stored alongside the executable:
- **projects**: Project information and metadata
- **time_blocks**: Individual time tracking entries
- **settings**: Application configuration

## Contributing

This project follows clean architecture principles:
- Keep backend logic in services
- Use proper error handling
- Maintain separation between frontend and backend
- Follow existing code patterns

## License

This project is licensed under the MIT License.
