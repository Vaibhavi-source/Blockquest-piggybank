$downloadPath = "$env:TEMP\solana-release.tar.bz2"
$installDir   = "$env:USERPROFILE\.local\share\solana\install"
$activeDir    = "$installDir\active_release"
$binDir       = "$activeDir\bin"
$sevenZip     = "C:\Program Files\7-Zip\7z.exe"

Write-Host "Step 1: Getting latest version..."
$release = (Invoke-WebRequest -Uri "https://api.github.com/repos/anza-xyz/agave/releases/latest" -UseBasicParsing | ConvertFrom-Json).tag_name
Write-Host "Version: $release"

if (Test-Path $downloadPath) {
    Write-Host "Step 2: Archive already downloaded, skipping."
} else {
    $url = "https://github.com/anza-xyz/agave/releases/download/$release/solana-release-x86_64-pc-windows-msvc.tar.bz2"
    Write-Host "Step 2: Downloading $url ..."
    Invoke-WebRequest -Uri $url -OutFile $downloadPath -UseBasicParsing
    Write-Host "Download complete."
}

Write-Host "Step 3: Extracting with 7-Zip (two passes)..."
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Write-Host "  Pass 1: .tar.bz2 -> .tar"
& $sevenZip x $downloadPath "-o$env:TEMP" -y

$tarFile = "$env:TEMP\solana-release.tar"
Write-Host "  Pass 2: .tar -> folder"
& $sevenZip x $tarFile "-o$installDir" -y

$extracted = Get-ChildItem -Path $installDir -Directory | Where-Object { $_.Name -like "solana-release*" } | Select-Object -First 1
if ($extracted) {
    if (Test-Path $activeDir) { Remove-Item $activeDir -Recurse -Force }
    Rename-Item $extracted.FullName $activeDir
    Write-Host "Renamed to active_release"
}

Write-Host "Step 4: Adding to PATH..."
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$binDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$binDir", "User")
    Write-Host "PATH updated."
} else {
    Write-Host "Already in PATH."
}

Write-Host ""
Write-Host "Verifying..."
$solanaExe = "$binDir\solana.exe"
if (Test-Path $solanaExe) {
    & $solanaExe --version
    Write-Host "SUCCESS - open a new terminal and run: solana --version"
} else {
    Write-Host "ERROR: $solanaExe not found. Check extraction output above."
}
