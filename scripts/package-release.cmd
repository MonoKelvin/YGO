@echo off
setlocal
cd /d "%~dp0.."
node scripts\package-release.mjs %*
set ERR=%ERRORLEVEL%
if %ERR% neq 0 (
  echo.
  echo [package-release] 失败，退出码 %ERR%
  pause
  exit /b %ERR%
)
exit /b 0
