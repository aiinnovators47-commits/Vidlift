#!/usr/bin/env pwsh

# Publish to GitHub Script
# This script automates the entire process of pushing your project to GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoName,
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "YouTube AI Tools - Automated YouTube management platform",
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubUsername = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Private = $false
)

Write-Host "🚀 Publishing project to GitHub..." -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Validate inputs
if (-not $GitHubUsername) {
    $GitHubUsername = Read-Host "Enter your GitHub username"
}

if (-not $GitHubUsername) {
    Write-Error "GitHub username is required!"
    exit 1
}

# Check if git is installed
try {
    git --version > $null
    Write-Host "✅ Git is installed" -ForegroundColor Green
} catch {
    Write-Error "Git is not installed or not in PATH"
    exit 1
}

# Check if GitHub CLI is installed
try {
    gh --version > $null
    $ghInstalled = $true
    Write-Host "✅ GitHub CLI is installed" -ForegroundColor Green
} catch {
    $ghInstalled = $false
    Write-Host "⚠️  GitHub CLI not found. Will use HTTPS authentication." -ForegroundColor Yellow
}

# Configure git user (if not already configured)
try {
    $currentUser = git config user.name
    $currentEmail = git config user.email
    if (-not $currentUser -or -not $currentEmail) {
        Write-Host "🔧 Configuring git user..." -ForegroundColor Yellow
        $userName = Read-Host "Enter your git username"
        $userEmail = Read-Host "Enter your git email"
        git config --global user.name $userName
        git config --global user.email $userEmail
    } else {
        Write-Host "✅ Git user already configured: $currentUser <$currentEmail>" -ForegroundColor Green
    }
} catch {
    Write-Error "Failed to configure git user"
    exit 1
}

# Add all files
Write-Host "📁 Adding files to git..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Yellow
    $commitNeeded = $false
} else {
    Write-Host "📝 Creating initial commit..." -ForegroundColor Cyan
    git commit -m "Initial commit: YouTube AI Tools platform"
    $commitNeeded = $true
}

# Create repository using GitHub CLI if available
if ($ghInstalled) {
    Write-Host "🌐 Creating repository using GitHub CLI..." -ForegroundColor Cyan
    
    $visibility = if ($Private) { "private" } else { "public" }
    
    try {
        gh repo create $RepoName --$visibility --description $Description --clone=false
        Write-Host "✅ Repository created successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Repository might already exist or creation failed" -ForegroundColor Yellow
        Write-Host "Continuing with manual setup..." -ForegroundColor Yellow
    }
} else {
    Write-Host "🌐 Manual repository setup required" -ForegroundColor Yellow
    Write-Host "Please create a new repository on GitHub manually:" -ForegroundColor Yellow
    Write-Host "1. Go to https://github.com/new" -ForegroundColor Yellow
    Write-Host "2. Repository name: $RepoName" -ForegroundColor Yellow
    Write-Host "3. Description: $Description" -ForegroundColor Yellow
    Write-Host "4. Set visibility to: $(if ($Private) { 'Private' } else { 'Public' })" -ForegroundColor Yellow
    Write-Host "5. Click 'Create repository'" -ForegroundColor Yellow
    Write-Host ""
    
    $manualSetup = Read-Host "Have you created the repository? (y/n)"
    if ($manualSetup -ne 'y' -and $manualSetup -ne 'Y') {
        Write-Host "Please create the repository first, then run this script again." -ForegroundColor Red
        exit 1
    }
}

# Add remote origin
$remoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"
Write-Host "🔗 Adding remote origin..." -ForegroundColor Cyan
git remote add origin $remoteUrl 2>$null

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
try {
    git push -u origin main
    Write-Host "🎉 Successfully published to GitHub!" -ForegroundColor Green
    Write-Host "🔗 Repository URL: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Blue
} catch {
    # If main branch doesn't exist, try master
    try {
        git push -u origin master
        Write-Host "🎉 Successfully published to GitHub!" -ForegroundColor Green
        Write-Host "🔗 Repository URL: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Blue
    } catch {
        Write-Error "Failed to push to GitHub. Please check your credentials and try again."
        Write-Host "You may need to:" -ForegroundColor Yellow
        Write-Host "1. Generate a personal access token at https://github.com/settings/tokens" -ForegroundColor Yellow
        Write-Host "2. Use the token as your password when prompted" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Publishing complete!" -ForegroundColor Green
Write-Host "Your project is now live on GitHub at: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Blue