const { contextBridge, ipcRenderer } = require('electron');

// Expose safe desktop bridge to renderer
contextBridge.exposeInMainWorld('iResideDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '2.1.0',
  sendNotification: (title, body) => {
    ipcRenderer.send('desktop:notify', { title, body });
  },
  openExternal: (url) => {
    ipcRenderer.send('desktop:open-external', url);
  },
  updateBrand: (brand) => {
    ipcRenderer.send('desktop:update-brand', brand);
  }
});
