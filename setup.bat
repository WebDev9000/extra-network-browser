@echo off
cd %~dp0api && cmd /c npm install
cd %~dp0app && cmd /c npm install
cd %~dp0app && cmd /c npm run build
cd %~dp0api/networks && init.bat