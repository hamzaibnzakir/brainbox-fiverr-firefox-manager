#!/usr/bin/env bash
set -euo pipefail
./scripts/migrate_existing_linux.sh
./scripts/build_sidecar_linux.sh
npm install
npm run tauri build
