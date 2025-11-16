const { app, BrowserWindow, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

// Disable hardware acceleration for better compatibility
app.disableHardwareAcceleration();

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Tersedia',
    message: `Versi baru ${info.version} tersedia!`,
    detail: 'Apakah Anda ingin mengunduh dan menginstall update sekarang?',
    buttons: ['Update Sekarang', 'Nanti'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
      
      // Show download progress dialog
      const progressDialog = new BrowserWindow({
        width: 400,
        height: 150,
        parent: mainWindow,
        modal: true,
        show: false,
        frame: false,
        resizable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });
      
      progressDialog.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 20px;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h3 { margin: 0 0 15px 0; color: #333; }
              .progress-bar {
                width: 100%;
                height: 20px;
                background: #e0e0e0;
                border-radius: 10px;
                overflow: hidden;
              }
              .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #2563eb);
                transition: width 0.3s ease;
                width: 0%;
              }
              .status { margin-top: 10px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h3>Mengunduh Update...</h3>
              <div class="progress-bar">
                <div class="progress-fill" id="progress"></div>
              </div>
              <div class="status" id="status">Memulai download...</div>
            </div>
          </body>
        </html>
      `);
      
      progressDialog.once('ready-to-show', () => {
        progressDialog.show();
      });
      
      autoUpdater.on('download-progress', (progressObj) => {
        progressDialog.webContents.executeJavaScript(`
          document.getElementById('progress').style.width = '${progressObj.percent}%';
          document.getElementById('status').textContent = 
            'Downloaded: ' + Math.round(progressObj.percent) + '% (' + 
            (progressObj.transferred / 1024 / 1024).toFixed(1) + 'MB / ' +
            (progressObj.total / 1024 / 1024).toFixed(1) + 'MB)';
        `);
      });
      
      autoUpdater.on('update-downloaded', () => {
        progressDialog.close();
        
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Siap',
          message: 'Update berhasil diunduh!',
          detail: 'Aplikasi akan restart dan menginstall update sekarang.',
          buttons: ['Restart Sekarang'],
          defaultId: 0
        }).then(() => {
          autoUpdater.quitAndInstall(false, true);
        });
      });
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available');
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  dialog.showMessageBox(mainWindow, {
    type: 'error',
    title: 'Update Error',
    message: 'Terjadi kesalahan saat update',
    detail: err.message,
    buttons: ['OK']
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    autoHideMenuBar: false,
    title: 'TABUNGAN SMK GLOBIN'
  });

  // Create custom menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools()
        },
        { type: 'separator' },
        {
          label: 'Keluar',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 1);
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.setZoomLevel(0)
        },
        { type: 'separator' },
        {
          label: 'Fullscreen',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Tentang',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Tentang Aplikasi',
              message: 'TABUNGAN SMK GLOBIN',
              detail: `Sistem Manajemen Tabungan Siswa SMK Globin\n\nVersi ${app.getVersion()}\n\n© 2025 SMK Globin`,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Cek Update',
          click: () => {
            autoUpdater.checkForUpdates().catch(err => {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Cek Update',
                message: 'Tidak dapat memeriksa update',
                detail: 'Pastikan Anda terhubung ke internet.',
                buttons: ['OK']
              });
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Determine which URL to load
  const isDev = process.env.NODE_ENV === 'development';
  const startUrl = isDev
    ? 'http://localhost:8080'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates after app is ready (only in production)
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    // Check for updates on startup
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Auto-update check failed:', err);
      });
    }, 3000);
    
    // Check for updates every 6 hours
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Auto-update check failed:', err);
      });
    }, 6 * 60 * 60 * 1000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
