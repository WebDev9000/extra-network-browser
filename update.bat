@echo off

git pull

cd %~dp0api && call npm install --no-audit
cd %~dp0app && call npm install --no-audit
cd %~dp0app && call npm run build
cd %~dp0api/networks && call init.bat
cd %~dp0
echo Update complete.
echo Run start.bat to begin.
