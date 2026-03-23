# TechZone POS - Desktop Build Instructions

## Prerequisites

Before building, you need:

1. **Python 3.10 or higher**
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Node.js 18 or higher**
   - Download from: https://nodejs.org/
   - Install the LTS version

3. **Git** (optional, for cloning the repository)
   - Download from: https://git-scm.com/

## Quick Build (Automatic)

1. Open Command Prompt in the `desktop_build` folder
2. Run: `build-windows.bat`
3. Wait for the build to complete
4. Find the executable in `dist\TechZone-POS.exe`

## Manual Build Steps

If the automatic build fails, follow these steps:

### Step 1: Create Virtual Environment
```batch
cd desktop_build
python -m venv venv
venv\Scripts\activate
```

### Step 2: Install Python Dependencies
```batch
pip install -r requirements-build.txt
```

### Step 3: Build Frontend
```batch
cd ..\frontend
npm install
npm run build
cd ..\desktop_build
```

### Step 4: Copy Frontend to Desktop Build
```batch
xcopy /E /I /Y ..\frontend\build frontend
```

### Step 5: Build Executable
```batch
pyinstaller --clean TechZone-POS.spec
```

### Step 6: Run the Application
```batch
dist\TechZone-POS.exe
```

## Distribution

To distribute the application:

1. Copy the entire `dist` folder
2. Rename it to `TechZone-POS`
3. Users can run `TechZone-POS.exe` directly

## Data Storage

The application stores data in:
- `data\techzone.db` - SQLite database
- `data\uploads\` - Uploaded files (logos, etc.)

These are created next to the executable.

## First Run

1. Double-click `TechZone-POS.exe`
2. Your browser will open to http://localhost:8001
3. Create an admin account on first run
4. Login and start using the app

## Troubleshooting

### "Python not found"
- Install Python from python.org
- Make sure "Add Python to PATH" is checked during installation

### "Node not found"
- Install Node.js from nodejs.org
- Restart Command Prompt after installation

### "Module not found" errors
- Make sure you activated the virtual environment
- Run `pip install -r requirements-build.txt` again

### Application won't start
- Check if port 8001 is already in use
- Try running from Command Prompt to see error messages

### Data not saving
- Make sure the `data` folder has write permissions
- Check if antivirus is blocking the database file

## Support

For issues, contact: support@techzone.com
