const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Get the backend URL (for desktop, it's always localhost)
  getBackendUrl: () => 'http://127.0.0.1:8001',
  
  // Check if running in Electron
  isElectron: () => true,
  
  // App version
  getVersion: () => require('../../package.json').version
});
