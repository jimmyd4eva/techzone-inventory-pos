# -*- coding: utf-8 -*-
"""
TechZone POS - Desktop Application
This is a standalone version that runs without external dependencies.
Uses SQLite for local database storage.
"""

import os
import sys
import json
import webbrowser
import threading
import time
from pathlib import Path

# Set environment for desktop mode BEFORE importing anything else
os.environ['DB_TYPE'] = 'sqlite'

# Get the application directory
if getattr(sys, 'frozen', False):
    # Running as compiled .exe
    APP_DIR = Path(sys.executable).parent
else:
    # Running as script
    APP_DIR = Path(__file__).parent

# Set paths
DATA_DIR = APP_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)

os.environ['SQLITE_PATH'] = str(DATA_DIR / 'techzone.db')
os.environ['UPLOAD_DIR'] = str(DATA_DIR / 'uploads')

# Create uploads directory
UPLOAD_DIR = DATA_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# Now we can import uvicorn and the app
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

# Import the main server
# We need to modify the import path for the compiled version
if getattr(sys, 'frozen', False):
    # For compiled version, server.py is bundled
    from server import app as api_app, api_router
else:
    # For development, import from current directory
    sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))
    from server import app as api_app, api_router

# Create the desktop app
desktop_app = FastAPI(title="TechZone POS Desktop")

# CORS
desktop_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the API router
desktop_app.include_router(api_router, prefix="/api")

# Serve static frontend files
FRONTEND_DIR = APP_DIR / 'frontend'
if FRONTEND_DIR.exists():
    desktop_app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / 'static')), name="static")

# Serve the React app for all non-API routes
@desktop_app.get("/{full_path:path}")
async def serve_frontend(request: Request, full_path: str):
    """Serve the React frontend for all routes"""
    # Skip API routes
    if full_path.startswith("api/"):
        return {"error": "Not found"}
    
    # Check for static files first
    file_path = FRONTEND_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Return index.html for all other routes (React Router)
    index_path = FRONTEND_DIR / 'index.html'
    if index_path.exists():
        return FileResponse(index_path)
    
    return HTMLResponse(content="""
        <html>
            <head><title>TechZone POS</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>TechZone POS</h1>
                <p>Frontend files not found. Please ensure the 'frontend' folder exists.</p>
                <p>API is running at: <a href="/api/health">/api/health</a></p>
            </body>
        </html>
    """)

def open_browser():
    """Open the browser after a short delay"""
    time.sleep(2)
    webbrowser.open('http://localhost:8001')

def main():
    print("=" * 50)
    print("TechZone POS - Desktop Edition")
    print("=" * 50)
    print()
    print(f"Data directory: {DATA_DIR}")
    print(f"Database: {os.environ['SQLITE_PATH']}")
    print()
    print("Starting server on http://localhost:8001")
    print("Press Ctrl+C to stop")
    print()
    
    # Open browser in background
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run the server
    uvicorn.run(
        desktop_app,
        host="127.0.0.1",
        port=8001,
        log_level="info"
    )

if __name__ == "__main__":
    main()
