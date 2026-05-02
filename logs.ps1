$env:PATH += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
Write-Host "=== PiggyBank Live Logs ===" -ForegroundColor Cyan
Write-Host "Watching: FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12" -ForegroundColor Yellow
Write-Host "Auto-reconnects on disconnect. Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""
while ($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Streaming..." -ForegroundColor DarkGreen
    solana logs FU2A8cDehHnfvu7kK23jrefPBuzdnz8ahQwQoZ8Cth12
    Write-Host "Reconnecting..." -ForegroundColor DarkYellow
    Start-Sleep 1
}
