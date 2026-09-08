# Brainbox Firefox Manager — Desktop Edition

This is the production packaging direction for Brainbox Firefox Manager.

## What users get

A normal desktop application. No Node.js, Python, npm or terminal is required after packaging.

The React interface runs inside Tauri, while the proven Python browser/proxy engine is bundled as a native sidecar executable.

## Linux build

```bash
./build-linux.sh
```

Outputs are created by Tauri under `src-tauri/target/release/bundle/`.

## Windows build

Open PowerShell in the project root:

```powershell
.\build-windows.ps1
```

The Windows sidecar is built with PyInstaller and Tauri creates the NSIS installer.

## Development

```bash
npm install
./scripts/migrate_existing_linux.sh
./scripts/build_sidecar_linux.sh
npm run tauri dev
```

The legacy systemd engine is deliberately disabled when moving to the desktop edition. The desktop app owns the engine lifecycle.


## Tab monitor

Brainbox can monitor tabs opened by managed Firefox sessions. When enabled, it schedules a random refresh between the configured minimum and maximum interval. The minimum is enforced at 5 minutes. The monitor refreshes every currently open WebDriver tab in each managed Firefox session.

The desktop engine uses Firefox's supported WebDriver/Marionette stack through geckodriver. Firefox supports connecting to and controlling an existing browser through its remote automation protocols, and geckodriver provides the WebDriver interface for Firefox.
