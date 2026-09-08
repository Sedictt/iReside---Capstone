const { app, BrowserWindow, shell, ipcMain, session, Notification, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Check for baked-in target URL or environment variables
function getTargetUrl() {
  // 1. Command-line argument override: --target=http://...
  for (const arg of process.argv) {
    if (arg.startsWith('--target=')) {
      return arg.slice(9);
    }
  }

  // 2. Environment variable override
  if (process.env.TARGET_URL) {
    return process.env.TARGET_URL;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 3. Baked configuration file if generated during build
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.targetUrl) return config.targetUrl;
    } catch (e) {
      console.error('[Desktop] Failed reading config.json', e);
    }
  }

  // 4. Default fallback: localhost for local development / defense demo
  return 'http://localhost:3000';
}

const TARGET_URL = getTargetUrl();
let currentBrandTitle = 'iReside — Integrated Rental Property Management Platform';

function createWindow() {
  const iconPath = path.join(__dirname, 'build', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: currentBrandTitle,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#090d16',
    show: false, // Don't show until ready-to-show to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: true
    }
  });

  // Intercept HTML <title> overrides to preserve the property brand name
  mainWindow.on('page-title-updated', (event, title) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.setTitle(currentBrandTitle);
    }
  });

  // Enable hardware acceleration for 2D Interactive Floorplans & Three.js canvas
  mainWindow.webContents.setVisualZoomLevelLimits(1, 3);

  // Show gracefully once DOM is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the target URL
  console.log(`[Desktop] Navigating to: ${TARGET_URL}`);
  mainWindow.loadURL(TARGET_URL).catch((err) => {
    console.warn(`[Desktop] Initial load failed, showing offline fallback:`, err.message);
    const offlinePath = path.join(__dirname, 'offline.html');
    mainWindow.loadFile(offlinePath, { query: { target: TARGET_URL } });
  });

  // If page navigation fails (e.g. server offline or network drop), show local offline screen
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignore aborted loads or subframe failures
    if (errorCode === -3) return; // ABORTED
    console.warn(`[Desktop] Load error (${errorCode}): ${errorDescription} at ${validatedURL}`);
    const offlinePath = path.join(__dirname, 'offline.html');
    mainWindow.loadFile(offlinePath, { query: { target: TARGET_URL } });
  });

  // Handle external links (open in system default browser e.g. GCash, bank URLs, external docs)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      const targetParsed = new URL(TARGET_URL);

      // If opening on the same origin/host, allow standard in-app navigation
      if (parsed.host === targetParsed.host) {
        return { action: 'allow' };
      }
    } catch {
      // Invalid URL, let shell handle
    }

    // Open external URL in user's default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Download Manager: save PDF leases, invoices, and CSVs directly to Windows Downloads folder
function setupDownloadManager() {
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const filename = item.getFilename();
    const downloadFolder = app.getPath('downloads');
    const savePath = path.join(downloadFolder, filename);

    item.setSavePath(savePath);

    item.once('done', (event, state) => {
      if (state === 'completed') {
        const iconPath = path.join(__dirname, 'build', 'icon.ico');
        if (Notification.isSupported()) {
          new Notification({
            title: 'Download Complete',
            body: `Saved "${filename}" to your Downloads folder.`,
            icon: fs.existsSync(iconPath) ? iconPath : undefined
          }).show();
        }
      } else if (state === 'failed') {
        console.error(`[Desktop] Download failed for: ${filename}`);
      }
    });
  });
}

// IPC Handlers
ipcMain.on('desktop:notify', (event, { title, body }) => {
  const iconPath = path.join(__dirname, 'build', 'icon.ico');
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'iReside Notification',
      body: body || '',
      icon: fs.existsSync(iconPath) ? iconPath : undefined
    }).show();
  }
});

ipcMain.on('desktop:open-external', (event, url) => {
  if (url) shell.openExternal(url);
});

// Dynamic Runtime Brand Synchronization
ipcMain.on('desktop:update-brand', async (event, { propertyName, propertyTagline, logoUrl }) => {
  if (!mainWindow) return;

  if (propertyName) {
    const subtitle = propertyTagline ? ` — ${propertyTagline}` : '';
    currentBrandTitle = `${propertyName}${subtitle} · iReside`;
    mainWindow.setTitle(currentBrandTitle);
    console.log(`[Desktop] Window title dynamically updated to: ${currentBrandTitle}`);
  }

  if (logoUrl) {
    try {
      const fullUrl = logoUrl.startsWith('http') 
        ? logoUrl 
        : new URL(logoUrl, TARGET_URL).toString();

      console.log(`[Desktop] Synchronizing dynamic brand icon from: ${fullUrl}`);
      const res = await fetch(fullUrl);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const dynamicIcon = nativeImage.createFromBuffer(buffer);
        if (!dynamicIcon.isEmpty()) {
          mainWindow.setIcon(dynamicIcon);
          console.log(`[Desktop] Window icon dynamically updated to custom property emblem!`);
        }
      }
    } catch (err) {
      console.warn('[Desktop] Could not update runtime brand icon:', err.message);
    }
  }
});

// App lifecycle
app.whenReady().then(() => {
  // Set minimal application menu with zoom, reload, and fullscreen
  const template = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  setupDownloadManager();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
