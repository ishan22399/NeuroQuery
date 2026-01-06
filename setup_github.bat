@echo off
REM Setup GitHub repository for NeuroQuery

echo.
echo ===================================
echo NeuroQuery GitHub Setup
echo ===================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed
    echo Please install Git from https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Python and Git found
echo.

REM Run the auto commit script
python auto_commit.py

pause
