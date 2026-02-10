# YouTube AI Tools - Publish to GitHub Guide

## 🚀 Quick Publishing Options

### Option 1: PowerShell Script (Recommended)
```powershell
# Run the PowerShell script
.\publish-to-github.ps1 -RepoName "your-repo-name" -GitHubUsername "your-username"
```

### Option 2: Batch File (Simple)
Double-click `quick-publish.bat` or run:
```cmd
quick-publish.bat your-repo-name your-username
```

### Option 3: Manual Commands
```bash
# Initialize git
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: YouTube AI Tools platform"

# Add remote (replace with your details)
git remote add origin https://github.com/your-username/your-repo-name.git

# Push to GitHub
git push -u origin main
```

## 🛠 Prerequisites

1. **Git** must be installed and in your PATH
2. **GitHub account** ready
3. Optionally: **GitHub CLI** for automatic repository creation

## 🔧 Setup Steps

### 1. Install Git
Download from: https://git-scm.com/downloads

### 2. Configure Git (First time only)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. GitHub Authentication
You'll need either:
- **Personal Access Token** (recommended): https://github.com/settings/tokens
- **SSH Keys**: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## 📋 What Gets Published

The script automatically:
- ✅ Initializes git repository
- ✅ Creates proper `.gitignore` file
- ✅ Adds all project files
- ✅ Makes initial commit
- ✅ Creates GitHub repository (if GitHub CLI is installed)
- ✅ Sets up remote origin
- ✅ Pushes code to GitHub

## 🛑 What's Ignored

Files excluded from publishing:
- Environment files (`.env`, `.env.local`)
- Node modules (`node_modules/`)
- Build outputs (`.next/`, `out/`)
- Log files
- IDE configuration
- Database files
- Temporary files

## 🆘 Troubleshooting

### Authentication Issues
If you get authentication errors:
1. Generate a Personal Access Token: https://github.com/settings/tokens
2. Use the token as your password when prompted
3. Or set up SSH keys for password-less authentication

### Repository Already Exists
If the repository already exists on GitHub:
1. Skip the repository creation step
2. Just run the push commands

### Branch Name Issues
If you get branch errors:
- The script tries both `main` and `master` branches
- Make sure your default branch name matches

## 📚 Additional Resources

- [GitHub CLI Documentation](https://cli.github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [Personal Access Tokens](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## 🎯 One-Click Publishing

After setup, you can publish with just:
```powershell
.\publish-to-github.ps1 -RepoName "yt-ai-tools" -GitHubUsername "yourusername"
```

The script will handle everything automatically!