@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5187/' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  start "" "http://127.0.0.1:5187/"
  exit /b 0
)
if not exist node_modules\three (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run 3d:dev -- --open
