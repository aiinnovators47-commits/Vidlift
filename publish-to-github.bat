@echo off
cls
echo ========================================
echo    YouTube AI Tools - GitHub Publisher   
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo ✅ Git is ready
echo.

REM Get repository details
set /p repo_name="Enter repository name (e.g., yt-ai-tools): "
if "%repo_name%"=="" (
    echo ❌ Repository name is required
    pause
    exit /b 1
)

set /p github_username="Enter your GitHub username: "
if "%github_username%"=="" (
    echo ❌ GitHub username is required
    pause
    exit /b 1
)

echo.
echo Repository: %repo_name%
echo Username: %github_username%
echo.

REM Confirm before proceeding
echo Ready to publish to GitHub?
choice /C YN /M "Continue"
if errorlevel 2 (
    echo Cancelled by user
    pause
    exit /b 0
)

echo.
echo 🚀 Publishing to GitHub...
echo ==========================

REM Add all files (in case there are new ones)
echo 📁 Adding files...
git add .

REM Check if there are changes
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo 📝 Committing changes...
    git commit -m "Update: Automated publish"
) else (
    echo ℹ️  No changes to commit
)

REM Set remote URL
echo 🔗 Setting remote...
set remote_url=https://github.com/%github_username%/%repo_name%.git
git remote add origin %remote_url% 2>nul

REM Try to push
echo 📤 Pushing to GitHub...
git push -u origin main 2>nul
if errorlevel 1 (
    echo Trying master branch...
    git push -u origin master 2>nul
    if errorlevel 1 (
        echo ❌ Failed to push to GitHub
        echo You may need to:
        echo 1. Create the repository on GitHub first
        echo 2. Or use a Personal Access Token for authentication
        echo.
        echo Repository URL to create: https://github.com/new
        pause
        exit /b 1
    )
)

echo.
echo 🎉 SUCCESS! Published to GitHub!
echo =================================
echo Repository URL: https://github.com/%github_username%/%repo_name%
echo.
echo Next steps:
echo 1. Visit the URL above to view your repository
echo 2. Enable GitHub Pages for website hosting (optional)
echo 3. Set up CI/CD workflows (optional)
echo.
pause