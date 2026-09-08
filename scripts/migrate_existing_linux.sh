#!/usr/bin/env bash
set -euo pipefail
systemctl --user disable --now brainbox-browser.service 2>/dev/null || true
rm -f "$HOME/.config/systemd/user/brainbox-browser.service"
systemctl --user daemon-reload 2>/dev/null || true
printf '%s\n' 'Old Brainbox systemd engine disabled. The desktop app will own the engine now.'
