const { app, BrowserWindow, net: electronNet, protocol } = require('electron');
const { spawn } = require('node:child_process');
const tcp = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([{
  scheme: 'shareshelf',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true }
}]);

const projectDir = path.resolve(__dirname, '..');
const backendDir = path.join(projectDir, 'backend');
const frontendDir = path.join(projectDir, 'frontend');
const frontendUrl = 'shareshelf://app/index.html';
let backendProcess = null;
let mainWindow = null;

function isBackendAvailable() {
  return new Promise(resolve => {
    const socket = tcp.createConnection({ host: '127.0.0.1', port: 5000 });
    socket.setTimeout(700);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => resolve(false));
  });
}

function waitForBackend(timeoutMs = 10000) {
  return new Promise(resolve => {
    const startedAt = Date.now();
    const poll = async () => {
      if (await isBackendAvailable()) return resolve(true);
      if (Date.now() - startedAt >= timeoutMs) return resolve(false);
      setTimeout(poll, 250);
    };
    poll();
  });
}

async function startBackend() {
  if (await isBackendAvailable()) return true;

  const portableNodeDir = path.resolve(projectDir, '..', '..', 'tools');
  const portableNodeFolder = fs.existsSync(portableNodeDir)
    ? fs.readdirSync(portableNodeDir, { withFileTypes: true })
      .find(entry => entry.isDirectory() && /^node-v.*-win-x64$/i.test(entry.name)
        && fs.existsSync(path.join(portableNodeDir, entry.name, 'node.exe')))?.name
    : null;
  const portableNode = portableNodeFolder ? path.join(portableNodeDir, portableNodeFolder, 'node.exe') : 'node';
  backendProcess = spawn(process.env.SHARESHELF_NODE_BINARY || portableNode, ['server.js'], {
    cwd: backendDir,
    windowsHide: true,
    stdio: 'ignore',
    env: { ...process.env, HOST: '127.0.0.1' }
  });
  backendProcess.once('error', error => console.error('Could not start ShareShelf API:', error.message));
  return waitForBackend();
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    show: false,
    backgroundColor: '#f2f0e9',
    title: 'ShareShelf',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`ShareShelf page load failed (${code}): ${description} — ${url}`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('ShareShelf renderer stopped:', details.reason);
  });

  startBackend().catch(error => console.error('Could not start ShareShelf API:', error.message));
  await mainWindow.webContents.session.clearCache();
  await mainWindow.loadURL(frontendUrl);
}

app.whenReady().then(() => {
  console.log('ShareShelf desktop is ready.');
  protocol.handle('shareshelf', request => {
    const requestedPath = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, '') || 'index.html';
    const filePath = path.resolve(frontendDir, requestedPath);
    const relativePath = path.relative(frontendDir, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return new Response('Not found', { status: 404 });
    }
    return electronNet.fetch(pathToFileURL(filePath).toString());
  });
  return createWindow();
}).catch(error => console.error('ShareShelf desktop startup failed:', error));
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) backendProcess.kill();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
