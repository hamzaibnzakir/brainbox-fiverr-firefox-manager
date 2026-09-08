#!/usr/bin/env python3
"""Runtime hardening patches applied to the packaged desktop backend.

The desktop build uses desktop_backend.py as its sidecar entrypoint. Keeping
these patches in a small module lets us harden the packaged runtime without
forking the main backend implementation.
"""
from __future__ import annotations

import atexit
import os
import re
import signal
from pathlib import Path
from typing import Any

import backend

_PROXY_KEYS = (
    "network.proxy.type",
    "network.proxy.http",
    "network.proxy.http_port",
    "network.proxy.ssl",
    "network.proxy.ssl_port",
    "network.proxy.no_proxies_on",
)


def _backup_path(profile_path: Path) -> Path:
    return profile_path / "prefs.js.brainbox-backup"


def _is_brainbox_proxy_config(text: str, local_port: int) -> bool:
    http = re.search(r'user_pref\("network\.proxy\.http",\s*"127\.0\.0\.1"\)', text)
    ssl = re.search(r'user_pref\("network\.proxy\.ssl",\s*"127\.0\.0\.1"\)', text)
    http_port = re.search(r'user_pref\("network\.proxy\.http_port",\s*(\d+)\)', text)
    ssl_port = re.search(r'user_pref\("network\.proxy\.ssl_port",\s*(\d+)\)', text)
    ports = {int(m.group(1)) for m in (http_port, ssl_port) if m}
    return bool((http or ssl) and local_port in ports)


def _rewrite_proxy(text: str, local_port: int) -> str:
    lines = text.splitlines(True)
    filtered = [line for line in lines if not any(f'user_pref("{key}"' in line for key in _PROXY_KEYS)]
    filtered.extend([
        'user_pref("network.proxy.type", 1);\n',
        'user_pref("network.proxy.http", "127.0.0.1");\n',
        f'user_pref("network.proxy.http_port", {local_port});\n',
        'user_pref("network.proxy.ssl", "127.0.0.1");\n',
        f'user_pref("network.proxy.ssl_port", {local_port});\n',
        'user_pref("network.proxy.no_proxies_on", "");\n',
    ])
    return "".join(filtered)


def _disable_proxy(text: str) -> str:
    lines = text.splitlines(True)
    filtered = [line for line in lines if not any(f'user_pref("{key}"' in line for key in _PROXY_KEYS)]
    filtered.append('user_pref("network.proxy.type", 0);\n')
    return "".join(filtered)


def _restore_profile_proxy(profile_path: Path, profile_name: str | None = None) -> bool:
    prefs = profile_path / "prefs.js"
    backup = _backup_path(profile_path)
    label = profile_name or profile_path.name
    try:
        if backup.exists():
            prefs.write_text(backup.read_text(errors="ignore"), encoding="utf-8")
            backup.unlink(missing_ok=True)
            return True
        if prefs.exists():
            current = prefs.read_text(errors="ignore")
            # Profiles created by older Brainbox builds may have the local
            # bridge persisted without an original backup. Disable only that
            # known Brainbox configuration rather than touching real proxies.
            if re.search(r'user_pref\("network\.proxy\.http",\s*"127\.0\.0\.1"\)', current) or re.search(
                r'user_pref\("network\.proxy\.ssl",\s*"127\.0\.0\.1"\)', current
            ):
                prefs.write_text(_disable_proxy(current), encoding="utf-8")
                return True
        return False
    except Exception as exc:
        backend.ENGINE._log("error", f"Could not restore Firefox proxy: {exc}", label)
        return False


def _configure_proxy(self: backend.Engine, p: dict[str, Any]) -> bool:
    path = self._profile_path(p)
    prefs = path / "prefs.js"
    if not path.exists():
        self._log("error", f"Firefox profile missing: {path}", p.get("name"))
        return False
    try:
        path.mkdir(parents=True, exist_ok=True)
        backup = _backup_path(path)

        # A previous crash/forced close may have left the bridge settings in
        # prefs.js. Restore the user's original settings before taking the next
        # backup, then install a fresh Brainbox bridge configuration.
        if backup.exists():
            prefs.write_text(backup.read_text(errors="ignore"), encoding="utf-8")
            backup.unlink(missing_ok=True)

        original = prefs.read_text(errors="ignore") if prefs.exists() else ""
        local_port = int(p["local_port"])
        if original and not _is_brainbox_proxy_config(original, local_port):
            backup.write_text(original, encoding="utf-8")

        prefs.write_text(_rewrite_proxy(original, local_port), encoding="utf-8")
        return True
    except Exception as exc:
        self._log("error", f"Could not configure Firefox proxy: {exc}", p.get("name"))
        return False


_original_stop_process = backend.Engine._stop_process
_original_launch_process = backend.Engine._launch_process
_original_do_post = backend.Handler.do_POST


def _stop_process(self: backend.Engine, pid: str, p: dict[str, Any]) -> None:
    # The browser must be fully stopped before prefs.js is restored.
    _original_stop_process(self, pid, p)
    try:
        self._restore_proxy_for_profile(p)
    except Exception as exc:
        self._log("error", f"Proxy restore failed: {exc}", p.get("name"))


def _restore_proxy_for_profile(self: backend.Engine, p: dict[str, Any]) -> None:
    path = self._profile_path(p)
    if _restore_profile_proxy(path, p.get("name")):
        self._log("system", "Firefox proxy settings restored", p.get("name"))


def _launch_process(self: backend.Engine, pid: str, p: dict[str, Any]) -> None:
    # desktop_backend supplies the WebDriver launch implementation. Give it
    # the already-resolved target so the Use Default Website switch is honored.
    resolved = dict(p)
    resolved["targetWebsite"] = self._target_for_profile(p)
    return _original_launch_process(self, pid, resolved)


def _shutdown_handler(self: backend.Handler) -> None:
    path = self.path.rstrip("/")
    if path == "/api/shutdown":
        try:
            backend.ENGINE.stop_all()
            backend.json_response(self, 200, {"ok": True})
        except Exception as exc:
            backend.json_response(self, 500, {"ok": False, "error": str(exc)})
        return
    return _original_do_post(self)


def _shutdown() -> None:
    try:
        backend.ENGINE.stop_all()
    except Exception:
        pass


def apply() -> None:
    backend.Engine._configure_proxy = _configure_proxy
    backend.Engine._stop_process = _stop_process
    backend.Engine._restore_proxy_for_profile = _restore_proxy_for_profile
    backend.Engine._launch_process = _launch_process
    backend.Handler.do_POST = _shutdown_handler
    atexit.register(_shutdown)

    if os.name != "nt":
        try:
            signal.signal(signal.SIGTERM, lambda *_args: _shutdown())
            signal.signal(signal.SIGINT, lambda *_args: _shutdown())
        except Exception:
            pass
