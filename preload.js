const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('starkCore', {
    initializeConversion: (xmlPath) => ipcRenderer.invoke('run-conversion', xmlPath),
    openFileDialog:       ()        => ipcRenderer.invoke('open-file-dialog'),
    onLogUpdate: (callback) => ipcRenderer.on('log-message', (event, value) => callback(value)),
});

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    close:    () => ipcRenderer.invoke('window-close'),
});
