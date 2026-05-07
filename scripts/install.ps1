$ErrorActionPreference = "Stop"

$Repo = "RollingGo-AI/rollinggo-flight-cli"
$BinaryName = "rollinggo-flight"
$InstallDir = "$env:LOCALAPPDATA\Programs\rollinggo-flight"

# Get latest release version
$Release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
$Version = $Release.tag_name

$Artifact = "$BinaryName-win-x64.exe"
$Url = "https://github.com/$Repo/releases/download/$Version/$Artifact"

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

Write-Host "Downloading $BinaryName $Version (win-x64)..."
Invoke-WebRequest -Uri $Url -OutFile "$InstallDir\$BinaryName.exe"

# Add to user PATH if not already present
$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($CurrentPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$InstallDir", "User")
    Write-Host "Added $InstallDir to PATH"
    Write-Host "Restart your terminal to use $BinaryName"
}

Write-Host ""
Write-Host "Installed: $InstallDir\$BinaryName.exe"
Write-Host "Run: $BinaryName --help"
