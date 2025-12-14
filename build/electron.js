const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Crashout",
    icon: path.join(__dirname, 'favicon.ico'), // Icon is now in the same folder
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
  });

  // CRITICAL CHANGE: We removed 'build' from this path because
  // in the final app, this file sits right next to index.html
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});