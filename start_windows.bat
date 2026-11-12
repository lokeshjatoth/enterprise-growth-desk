@echo off
cd /d "%~dp0"
echo Starting Enterprise Growth Desk. Keep this window open.
echo Open http://127.0.0.1:8765 in your browser.
where py >nul 2>&1
if %errorlevel% equ 0 (
  py -3 app.py
) else (
  python app.py
)
pause
