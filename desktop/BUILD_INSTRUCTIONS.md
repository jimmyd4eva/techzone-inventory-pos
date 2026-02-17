# SalesTax POS - Windows Desktop Build Instructions

## Prerequisites

Before building the Windows installer, you need to install:

1. **Node.js** (v18 or higher): https://nodejs.org/
2. **Python** (v3.9 or higher): https://www.python.org/downloads/
3. **Git**: https://git-scm.com/download/win

## Step 1: Clone/Download the Project

If you saved to GitHub:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

## Step 2: Install Dependencies

### Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
pip install aiosqlite
cd ..
```

### Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Desktop Dependencies
```bash
cd desktop
npm install
cd ..
```

## Step 3: Build the Frontend

```bash
cd frontend
npm run build
cd ..

# Copy built files to desktop folder
xcopy /E /I frontend\build desktop\frontend-build
```

## Step 4: Configure for Desktop Mode

Edit `backend/.env` and add:
```
DB_TYPE=sqlite
SQLITE_PATH=./data/salestax.db
```

## Step 5: Build the Windows Installer

```bash
cd desktop
npm run build:win
```

The installer will be created in `desktop/dist/` folder:
- `SalesTax POS Setup x.x.x.exe` - The installer file

## Step 6: Install and Run

1. Double-click the installer `.exe`
2. Follow the installation wizard
3. Launch "SalesTax POS" from Start Menu or Desktop

## Troubleshooting

### Python not found
- Make sure Python is in your system PATH
- Or edit `desktop/src/main.js` to specify the full Python path

### Backend won't start
- Check that all Python dependencies are installed
- Run `pip install -r backend/requirements.txt` again

### Database errors
- Delete `%APPDATA%/salestax-pos/salestax.db` to reset the database
- The app will create a fresh database on next start

## File Structure

```
project/
├── backend/           # Python FastAPI server
├── frontend/          # React web app
├── desktop/           # Electron wrapper
│   ├── src/
│   │   ├── main.js    # Electron main process
│   │   └── preload.js # Preload script
│   ├── assets/        # Icons
│   └── package.json   # Electron config
└── README.md
```

## Default Login

- Username: `admin`
- Password: `admin123`

## Notes

- The desktop version uses SQLite (local database)
- Data is stored in `%APPDATA%/salestax-pos/`
- The web version continues to use MongoDB (cloud)
- Both versions can run independently
