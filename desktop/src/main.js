const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Determine if we're in development or production
const isDev = !app.isPackaged;

let mainWindow;
let backendProcess;

// Backend configuration
const BACKEND_PORT = 8001;
const FRONTEND_PORT = 3000;

function getBackendPath() {
  if (isDev) {
    return path.join(__dirname, '..', '..', 'backend');
  }
  return path.join(process.resourcesPath, 'backend');
}

function getPythonPath() {
  // In production, we'll bundle Python or use system Python
  if (process.platform === 'win32') {
    // Try common Python locations on Windows
    const possiblePaths = [
      'python',
      'python3',
      path.join(process.resourcesPath, 'python', 'python.exe'),
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe',
      'C:\\Python39\\python.exe',
    ];
    
    for (const p of possiblePaths) {
      try {
        require('child_process').execSync(`${p} --version`, { stdio: 'ignore' });
        return p;
      } catch (e) {
        continue;
      }
    }
  }
  return 'python3';
}

async function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = getBackendPath();
    const pythonPath = getPythonPath();
    
    console.log('Starting backend from:', backendPath);
    console.log('Using Python:', pythonPath);
    
    // Set environment variables for SQLite mode
    const env = {
      ...process.env,
      DB_TYPE: 'sqlite',
      SQLITE_PATH: path.join(app.getPath('userData'), 'salestax.db'),
      JWT_SECRET: 'desktop-app-secret-key',
    };
    
    // Ensure data directory exists
    const dataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    backendProcess = spawn(pythonPath, [
      '-m', 'uvicorn',
      'server:app',
      '--host', '127.0.0.1',
      '--port', String(BACKEND_PORT),
      '--reload'
    ], {
      cwd: backendPath,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    backendProcess.stdout.on('data', (data) => {
      console.log('Backend:', data.toString());
      if (data.toString().includes('Application startup complete')) {
        resolve();
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error('Backend Error:', data.toString());
      if (data.toString().includes('Application startup complete')) {
        resolve();
      }
    });
    
    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });
    
    // Resolve after timeout if startup message not detected
    setTimeout(resolve, 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    title: 'SalesTax POS',
    autoHideMenuBar: true
  });
  
  // In development, load from React dev server
  // In production, load from built files
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    // Load the built React app
    mainWindow.loadFile(path.join(__dirname, '..', 'frontend-build', 'index.html'));
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    console.log('Starting SalesTax POS Desktop...');
    
    // Start backend server
    await startBackend();
    console.log('Backend started successfully');
    
    // Create the main window
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  // Ensure backend is killed
  if (backendProcess) {
    backendProcess.kill();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
