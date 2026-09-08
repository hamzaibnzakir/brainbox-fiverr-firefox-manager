# Brainbox Firefox Manager Desktop Build

The final architecture is a Tauri desktop shell with the existing Python browser/proxy engine packaged as a sidecar executable. End users do not need Node.js, Python, npm, or a terminal.

## Linux development

1. `npm install`
2. `./scripts/migrate_existing_linux.sh`
3. `./scripts/build_sidecar_linux.sh`
4. `npm run tauri dev`

## Linux release

`npm run tauri build`

Produces AppImage and Debian packages under `src-tauri/target/release/bundle/` after a successful Tauri build.

## Windows release

Build the same project on Windows after producing a Windows PyInstaller sidecar named with the Windows target triple. Tauri can then produce an NSIS setup executable or MSI. The app keeps the same React frontend and Python engine architecture.
