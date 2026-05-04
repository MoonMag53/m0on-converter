const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    backgroundColor: '#030508',
    frame: false,
    transparent: false,
    icon: path.join(__dirname, 'm0on_industries.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('index.html');
  
  win.once('ready-to-show', () => {
    win.show();
  });
  
  global.win = win;
}

app.whenReady().then(createWindow);

ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'XML Files', extensions: ['xml'] }],
    properties: ['openFile'],
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('run-conversion', async (event, xmlPath) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['converter.py', xmlPath]);

    let output = '';
    let errOutput = '';

    pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errOutput += data.toString(); });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(errOutput.trim() || `Process exited with code ${code}`);
      }
    });
  });
});

ipcMain.handle('window-minimize', () => {
  if (global.win) {
    global.win.minimize();
  }
});

ipcMain.handle('window-close', () => {
  if (global.win) {
    global.win.close();
  }
});
