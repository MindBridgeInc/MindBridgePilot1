@echo off
cd /d "%~dp0app"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
echo Starting MindBridge...
start http://localhost:5173
call npm run dev
