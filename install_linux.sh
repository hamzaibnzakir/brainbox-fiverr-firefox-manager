#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$HOME/brainbox-browser-manager"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$APP_DIR"
cp "$PROJECT_DIR/backend.py" "$APP_DIR/backend.py"
# Keep the user's proven config untouched. Only create it if missing.
if [[ ! -f "$APP_DIR/config.json" ]]; then
  if [[ -f "$PROJECT_DIR/config.example.json" ]]; then cp "$PROJECT_DIR/config.example.json" "$APP_DIR/config.json"; fi
fi
mkdir -p "$HOME/.config/systemd/user"
cat > "$HOME/.config/systemd/user/brainbox-browser.service" <<EOF
[Unit]
Description=Brainbox Firefox Manager Engine
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 %h/brainbox-browser-manager/backend.py
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now brainbox-browser.service
printf '\nBrainbox engine installed. API: http://127.0.0.1:8765/api\n'
printf 'Start the React UI from this project with: npm install && npm run dev\n'
