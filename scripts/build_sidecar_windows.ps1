$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
$GeckoVersion = "0.37.1"
New-Item -ItemType Directory -Force -Path ".build-tools" | Out-Null
$Zip = ".build-tools\geckodriver.zip"
$Url = "https://github.com/mozilla/geckodriver/releases/download/v$GeckoVersion/geckodriver-v$GeckoVersion-win64.zip"
Invoke-WebRequest -Uri $Url -OutFile $Zip
Expand-Archive -Path $Zip -DestinationPath ".build-tools\geckodriver" -Force
if (-not (Get-Command pyinstaller -ErrorAction SilentlyContinue)) {
  python -m pip install --upgrade pyinstaller
}
python -m PyInstaller --noconfirm --clean --onefile --noconsole --add-binary ".build-tools\geckodriver\geckodriver.exe;." --name brainbox-engine backend.py
$Triple = (rustc -vV | Select-String '^host:' | ForEach-Object { $_.Line -replace '^host:\s*','' }).Trim()
New-Item -ItemType Directory -Force -Path "src-tauri\binaries" | Out-Null
Copy-Item "dist\brainbox-engine.exe" "src-tauri\binaries\brainbox-engine-$Triple.exe" -Force
Write-Host "Built src-tauri\binaries\brainbox-engine-$Triple.exe"
