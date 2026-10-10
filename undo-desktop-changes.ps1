$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$backup = Join-Path $root 'undo-desktop-20261010'

Copy-Item (Join-Path $backup 'frontend\index.html') (Join-Path $root 'frontend\index.html') -Force
Copy-Item (Join-Path $backup 'frontend\app.js') (Join-Path $root 'frontend\app.js') -Force
Copy-Item (Join-Path $backup 'frontend\style.css') (Join-Path $root 'frontend\style.css') -Force
Copy-Item (Join-Path $backup 'backend\Env.js') (Join-Path $root 'backend\Env.js') -Force
Copy-Item (Join-Path $backup 'backend\server.js') (Join-Path $root 'backend\server.js') -Force
Copy-Item (Join-Path $backup 'README.md') (Join-Path $root 'README.md') -Force

Remove-Item (Join-Path $root 'desktop') -Recurse -Force
Remove-Item (Join-Path $root 'node_modules') -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $root 'package.json'), (Join-Path $root 'package-lock.json') -Force -ErrorAction SilentlyContinue
Write-Output 'ShareShelf files restored from the pre-desktop backup. The backup folder was kept.'
