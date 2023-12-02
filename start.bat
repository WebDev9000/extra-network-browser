@echo off
cd %~dp0api && start node index
cd %~dp0app && start npm run preview
cd %~dp0
