const { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, screen, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    provider: 'gemini',
    geminiKey: '',
    claudeKey: '',
    geminiModel: '',
    claudeModel: 'claude-sonnet-5',
    systemPrompt: 'You are analyzing a screenshot the user just took. Give a clear, concise, helpful answer based on what you see. If it\'s a question or quiz, answer it directly. If it\'s code, explain bugs or suggest fixes. Be direct - no fluff.',
    shortcut: 'CommandOrControl+Shift+S',
    alwaysOnTop: true,
    windowBounds: { width: 440, height: 720 }
  }
});

let mainWindow = null;
let tray = null;

function createWindow() {
  const bounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 360,
    minHeight: 500,
    frame: false,
    transparent: false,
    alwaysOnTop: store.get('alwaysOnTop'),
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setContentProtection(true);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  registerShortcut();
}

function registerShortcut() {
  globalShortcut.unregisterAll();
  const shortcut = store.get('shortcut');
  try {
    globalShortcut.register(shortcut, () => {
      if (mainWindow) mainWindow.webContents.send('trigger-snap');
    });
  } catch (e) {
    console.error('Failed to register shortcut:', e);
  }
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMkMEa+wAAABfSURBVDhPY/j//z8DMYCJgURANQMsQHECMjZRBhhuIMcAFDewuIFUQ0h2A6mGkOwGWBgQawipbsBiAMUhQLIbiDWAaDeQbACxBhDtBqININYNRBtArBuINoBYN/z/DwBPCzFL4JyLXAAAAABJRU5ErkJggg=='
  );
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Shitter AI', click: () => mainWindow?.show() },
    { label: 'Take Snap', click: () => mainWindow?.webContents.send('trigger-snap') },
    { type: 'separator' },
    { label: 'Provider: ' + store.get('provider').toUpperCase(), enabled: false },
    { type: 'separator' },
    { label: 'Always on Top', type: 'checkbox', checked: store.get('alwaysOnTop'), click: (item) => {
      store.set('alwaysOnTop', item.checked);
      mainWindow?.setAlwaysOnTop(item.checked);
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Shitter AI');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());
}

// Screenshot
ipcMain.handle('take-screenshot', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: screen.getPrimaryDisplay().workAreaSize
    });
    if (sources.length > 0) {
      return sources[0].thumbnail.toJPEG(85).toString('base64');
    }
    return null;
  } catch (e) {
    console.error('Screenshot failed:', e);
    return null;
  }
});

// Claude API call
async function callClaude(apiKey, model, systemPrompt, messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    if (response.status === 401) throw new Error('Invalid Claude API key.');
    throw new Error('Claude API error ' + response.status + ': ' + errBody);
  }

  const data = await response.json();
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

// Gemini API call
async function callGemini(apiKey, model, systemPrompt, messages) {
  // Convert messages to Gemini format
  const contents = [];

  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts = [];

    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          parts.push({ text: block.text });
        } else if (block.type === 'image') {
          parts.push({
            inlineData: {
              mimeType: block.source.media_type,
              data: block.source.data
            }
          });
        }
      }
    }

    contents.push({ role, parts });
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;

  const body = {
    contents: contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      maxOutputTokens: 4096
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errBody = await response.text();
    if (response.status === 400) throw new Error('Invalid Gemini API key or bad request: ' + errBody);
    throw new Error('Gemini API error ' + response.status + ': ' + errBody);
  }

  const data = await response.json();

  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts
      .filter(p => p.text)
      .map(p => p.text)
      .join('\n');
  }

  throw new Error('No response from Gemini');
}

// Main API handler
ipcMain.handle('call-ai', async (event, { messages, systemPrompt }) => {
  const provider = store.get('provider');

  try {
    if (provider === 'claude') {
      const apiKey = store.get('claudeKey');
      if (!apiKey) return { error: 'No Claude API key set. Open settings.' };
      const model = store.get('claudeModel');
      const text = await callClaude(apiKey, model, systemPrompt, messages);
      return { text };
    } else {
      const apiKey = store.get('geminiKey');
      if (!apiKey) return { error: 'No Gemini API key set. Open settings.' };
      const model = store.get('geminiModel');
      const text = await callGemini(apiKey, model, systemPrompt, messages);
      return { text };
    }
  } catch (e) {
    return { error: e.message };
  }
});

// Settings
ipcMain.handle('get-settings', () => {
  return {
    provider: store.get('provider'),
    geminiKey: store.get('geminiKey'),
    claudeKey: store.get('claudeKey'),
    geminiModel: store.get('geminiModel'),
    claudeModel: store.get('claudeModel'),
    systemPrompt: store.get('systemPrompt'),
    shortcut: store.get('shortcut'),
    alwaysOnTop: store.get('alwaysOnTop')
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  const keys = ['provider', 'geminiKey', 'claudeKey', 'geminiModel', 'claudeModel', 'systemPrompt', 'shortcut', 'alwaysOnTop'];
  for (const key of keys) {
    if (settings[key] !== undefined) store.set(key, settings[key]);
  }
  if (settings.shortcut !== undefined) registerShortcut();
  if (settings.alwaysOnTop !== undefined) mainWindow?.setAlwaysOnTop(settings.alwaysOnTop);
  return true;
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.on('open-external', (event, url) => shell.openExternal(url));

app.whenReady().then(() => { createWindow(); createTray(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
app.on('will-quit', () => { globalShortcut.unregisterAll(); });
