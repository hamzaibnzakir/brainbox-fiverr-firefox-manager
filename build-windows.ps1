$ErrorActionPreference = "Stop"
.\scripts\build_sidecar_windows.ps1
npm install
npm run tauri build -- --bundles nsis
Write-Host "Windows installer is in src-tauri\target\release\bundle\nsis"
