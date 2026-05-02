@echo off
setlocal enabledelayedexpansion
echo ============================================================
echo  Piggy Bank - Solana Dev Environment Setup
echo  (Rust + yarn already installed. Continuing from Step 3)
echo ============================================================
echo.

:: ── CHECK: Skip yarn (already installed) ─────────────────────
echo [1/5] yarn ... checking...
yarn --version >nul 2>&1 && (
    echo       yarn already installed. Skipping.
) || (
    echo       Installing yarn...
    npm install -g yarn
)
echo.

:: ── CHECK: Skip Rust (already installed) ─────────────────────
echo [2/5] Rust ... checking...
rustc --version >nul 2>&1 && (
    echo       Rust already installed. Skipping.
) || (
    echo       ERROR: Rust not found. Please install from https://rustup.rs
    echo       Then re-run this script.
    pause
    exit /b 1
)
echo.

:: ── STEP 3: Solana CLI ────────────────────────────────────────
echo [3/5] Installing Solana CLI...
solana --version >nul 2>&1 && (
    echo       Solana already installed. Skipping.
) || (
    :: Try to find Git Bash sh.exe
    set "GIT_SH="
    if exist "C:\Program Files\Git\bin\sh.exe"       set "GIT_SH=C:\Program Files\Git\bin\sh.exe"
    if exist "C:\Program Files (x86)\Git\bin\sh.exe" set "GIT_SH=C:\Program Files (x86)\Git\bin\sh.exe"

    if defined GIT_SH (
        echo       Found Git Bash. Installing Solana CLI...
        "!GIT_SH!" -c "sh -c \"$(curl -sSfL https://release.anza.xyz/stable/install)\""
    ) else (
        echo       Git Bash not found. Trying PowerShell fallback...
        powershell -Command "& { $ErrorActionPreference='Stop'; $src=(Invoke-WebRequest -Uri 'https://release.anza.xyz/stable/install' -UseBasicParsing).Content; $tmp=[System.IO.Path]::GetTempFileName()+'_sol_install.sh'; [IO.File]::WriteAllText($tmp,$src); Write-Host 'Download OK. Install via Git Bash or WSL.' }"
        echo.
        echo       MANUAL FALLBACK: Open Git Bash and run:
        echo         sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
        echo.
        echo       If you don't have Git Bash, download it from: https://git-scm.com/downloads
        pause
    )

    :: Add Solana to PATH for this session and permanently
    set "SOLANA_BIN=%USERPROFILE%\.local\share\solana\install\active_release\bin"
    echo       Adding Solana to PATH...
    set "PATH=!PATH!;!SOLANA_BIN!"
    setx PATH "%PATH%;%SOLANA_BIN%" >nul 2>&1
    echo       PATH updated. New terminal sessions will pick it up automatically.
)
echo.

:: ── STEP 4: Anchor CLI via AVM ───────────────────────────────
echo [4/5] Installing Anchor CLI via AVM...
anchor --version >nul 2>&1 && (
    echo       Anchor already installed. Skipping.
) || (
    echo       Running: cargo install avm  (this takes 10-15 min, please wait...)
    cargo install --git https://github.com/coral-xyz/anchor avm --force
    echo.
    echo       Installing latest Anchor version via AVM...
    avm install latest
    avm use latest
)
echo.

:: ── STEP 5: Devnet config + keypair + airdrop ────────────────
echo [5/5] Configuring Solana for devnet...
solana config set --url devnet

echo Checking for existing keypair...
IF NOT EXIST "%USERPROFILE%\.config\solana\id.json" (
    echo Generating new keypair at %USERPROFILE%\.config\solana\id.json ...
    solana-keygen new --outfile "%USERPROFILE%\.config\solana\id.json" --no-bip39-passphrase
) ELSE (
    echo Keypair already exists at %USERPROFILE%\.config\solana\id.json — skipping.
)

echo.
echo Requesting 2 SOL airdrop on devnet (may take a few seconds)...
solana airdrop 2
echo (If airdrop fails or is rate-limited, use: https://faucet.solana.com)
echo.

:: ── VERIFICATION ─────────────────────────────────────────────
echo ============================================================
echo  VERIFICATION - All tool versions:
echo ============================================================
echo.
echo [Rust]
rustc --version
cargo --version
echo.
echo [Node + yarn]
node --version
yarn --version
echo.
echo [Solana]
solana --version
solana address
solana balance
echo.
echo [Anchor]
anchor --version
echo.
echo ============================================================
echo  Done! Paste the version outputs above to Antigravity.
echo  We are ready to run: anchor init piggybank
echo ============================================================
pause
