# One-liner GitHub Publishing Command
# Save this as publish.cmd or run directly in PowerShell

param(
    [Parameter(Mandatory=$true)][string]$Repo,
    [Parameter(Mandatory=$true)][string]$User
)

Write-Host "🚀 Publishing $Repo to GitHub..." -ForegroundColor Green
git add .; git commit -m "Auto-publish: $(Get-Date)" -q; git remote add origin "https://github.com/$User/$Repo.git" 2>$null; git push -u origin main 2>$null || git push -u origin master
Write-Host "✅ Done! https://github.com/$User/$Repo" -ForegroundColor Blue