@echo off
chcp 65001 >nul
cd /d "%~dp0"
python tools\sync_event_data.py
start "" http://localhost:8080/
python -m http.server 8080
