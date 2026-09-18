const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  callAI: (params) => ipcRenderer.invoke('call-ai', params),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  onTriggerSnap: (callback) => ipcRenderer.on('trigger-snap', callback)
});
