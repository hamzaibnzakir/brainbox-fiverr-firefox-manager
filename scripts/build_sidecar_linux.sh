#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
GECKO_VERSION="0.37.1"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) ASSET="geckodriver-v${GECKO_VERSION}-linux64.tar.gz" ;;
  aarch64|arm64) ASSET="geckodriver-v${GECKO_VERSION}-linux-aarch64.tar.gz" ;;
  *) echo "Unsupported Linux architecture: $ARCH"; exit 1 ;;
esac
mkdir -p .build-tools
curl -fL "https://github.com/mozilla/geckodriver/releases/download/v${GECKO_VERSION}/${ASSET}" -o .build-tools/geckodriver.tar.gz
tar -xzf .build-tools/geckodriver.tar.gz -C .build-tools
chmod +x .build-tools/geckodriver

mkdir -p .build-tools/geo
curl -fL "https://github.com/sapics/ip-location-db/releases/download/latest/user-country-ipv4-num.csv" -o .build-tools/geo/user-country-ipv4-num.csv

python3 -m venv .sidecar-venv
source .sidecar-venv/bin/activate
python -m pip install --upgrade pip pyinstaller
pyinstaller --noconfirm --clean --onefile --add-binary ".build-tools/geckodriver:." --add-data ".build-tools/geo/user-country-ipv4-num.csv:data" --name brainbox-engine desktop_backend.py
TRIPLE="$(rustc -vV | sed -n 's/^host: //p')"
mkdir -p src-tauri/binaries
cp "dist/brainbox-engine" "src-tauri/binaries/brainbox-engine-${TRIPLE}"
chmod +x "src-tauri/binaries/brainbox-engine-${TRIPLE}"
echo "Built src-tauri/binaries/brainbox-engine-${TRIPLE}"
