# Brainbox Firefox Manager — Linux integration

## 1. Put the project anywhere

The backend reads the existing production config from:

`~/brainbox-browser-manager/config.json`

Do not replace that file if you already have your working profiles and proxies configured.

## 2. Install the engine service

From this project directory:

```bash
chmod +x install_linux.sh
./install_linux.sh
```

This replaces the old `brainbox-browser.service` command target with the new API engine. Your existing `config.json` is preserved.

## 3. Start the UI

```bash
npm install
npm run dev
```

Open the local Vite address shown by Vite.

The UI talks to:

`http://127.0.0.1:8765/api`

## 4. Verify the engine

```bash
curl http://127.0.0.1:8765/api/snapshot
```

You should receive JSON containing `engineOnline`, profiles, activity and settings.

## What this integration does

* Uses the existing Firefox profile folders and proxy configuration.
* Keeps proxy credentials on the local machine and never sends them to the React UI.
* Runs one authenticated localhost proxy bridge per profile.
* Launches Firefox with the correct isolated profile and destination site.
* Supports Start All, Stop All, Restart All and individual profile controls.
* Supports proxy tests and live status polling.
* Supports adding, editing, duplicating and deleting profile records.
* Discovers Firefox profiles on Linux, Windows and macOS paths.

## Important next stage

The current UI is a React/Vite application. The final commercial desktop package should wrap this UI with Tauri and bundle the Python engine as a sidecar so the user does not need Node, Python or a terminal. That is the cross-platform packaging stage, not a replacement for the engine.
