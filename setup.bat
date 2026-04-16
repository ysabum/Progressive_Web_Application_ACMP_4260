@echo off
title Glowworm Development Setup

echo ============================================
echo     Glowworm Development Environment
echo ============================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed.
    echo ➜ Install it from https://nodejs.org/
    pause
    exit /b
)

:: Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm is not installed.
    echo ➜ Install Node.js which includes npm.
    pause
    exit /b
)

echo ✔ Node and npm detected.
echo.

:: Install dependencies only if missing
if not exist node_modules (
    echo node_modules folder not found.
    echo Installing dependencies...
    npm install
) else (
    echo ✔ Dependencies already installed.
)

echo.
echo Starting Glowworm in development mode...
echo.

npm start