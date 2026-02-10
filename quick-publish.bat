@echo off
setlocal enabledelayedexpansion

echo 🚀 Quick Publish to GitHub
echo ==========================

REM Check if repository name is provided
if "%1"=="" (
    set /p repo_name="Enter repository name: "
) else (
    set repo_name=%1
)

REM Check if username is provided
if "%2"=="" (
    set /p github_username="Enter GitHub username: "
) else (
    set github_username=%2
)

REM Set default description
if "%3"=="" (
    set description=YouTube AI Tools - Automated YouTube management platform
) else (
    set description=%3
)

echo.
echo Repository: %repo_name%
echo Username: %github_username%
echo Description: %description%
echo.

REM Add all files
echo 📁 Adding files...
git add .

REM Create commit
echo 📝 Creating commit...
git commit -m "Initial commit: YouTube AI Tools platform"

REM Add remote
echo 🔗 Setting up remote...
set remote_url=https://github.com/%github_username%/%repo_name%.git
git remote add origin %remote_url% 2>nul

REM Push to GitHub
echo 📤 Pushing to GitHub...
git push -u origin main

if errorlevel 1 (
    echo Trying master branch...
    git push -u origin master
)

echo.
echo 🎉 Publishing complete!
echo Repository URL: https://github.com/%github_username%/%repo_name%
pause