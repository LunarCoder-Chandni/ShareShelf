const { spawn } = require('node:child_process');
const path = require('node:path');

const electronPath = require('electron');
const projectDir = path.resolve(__dirname, '..');
const childEnv = { ...process.env };
delete childEnv.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], {
  cwd: projectDir,
  env: childEnv,
  stdio: 'inherit',
  windowsHide: false
});

child.once('error', error => {
  console.error(`Could not launch the ShareShelf desktop window: ${error.message}`);
  process.exitCode = 1;
});
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
