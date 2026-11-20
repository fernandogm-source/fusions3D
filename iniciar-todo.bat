@echo off
setlocal
set "RAIZ=%~dp0"
set "RAIZ=%RAIZ:~0,-1%"

where wt >nul 2>&1
if %errorlevel%==0 (
    wt -w 0 new-tab --title "Backend API" -d "%RAIZ%\fusions3d-back" cmd /k npm run dev ; ^
    new-tab --title "Backend IA" -d "%RAIZ%\fusions3d-ai" cmd /k npm run dev ; ^
    new-tab --title "Gateway" -d "%RAIZ%\fusions3d-gateway" cmd /k npm start ; ^
    new-tab --title "Frontend" -d "%RAIZ%\fusions3d-front" cmd /k npm start
) else (
    start "Backend API" /D "%RAIZ%\fusions3d-back" cmd /k npm run dev
    start "Backend IA" /D "%RAIZ%\fusions3d-ai" cmd /k npm run dev
    start "Gateway" /D "%RAIZ%\fusions3d-gateway" cmd /k npm start
    start "Frontend" /D "%RAIZ%\fusions3d-front" cmd /k npm start
)

endlocal
