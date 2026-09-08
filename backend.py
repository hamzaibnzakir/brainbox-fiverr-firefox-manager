#!/usr/bin/env python3
"""Brainbox Firefox Manager local API + browser engine.

Runs only on 127.0.0.1.  The React desktop UI talks to this service.
The proxy bridge logic is the proven manager implementation, wrapped in a
small API so the UI can control profiles individually or as a group.
"""
from __future__ import annotations

import asyncio
import base64
import json
import os
import platform
import socket
import subprocess
import threading
import time
import urllib.parse
import urllib.request
import uuid
import random
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

BASE = Path.home() / "brainbox-browser-manager"
CONFIG_FILE = BASE / "config.json"
HOST = "127.0.0.1"
API_PORT = int(os.environ.get("BRAINBOX_API_PORT", "8765"))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_config() -> dict[str, Any]:
    if not CONFIG_FILE.exists():
        return {"website": "https://www.fiverr.com/users/manage_gigs", "startup_delay": 12, "profiles": []}
    with CONFIG_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_config(config: dict[str, Any]) -> None:
    BASE.mkdir(parents=True, exist_ok=True)
    tmp = CONFIG_FILE.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    tmp.replace(CONFIG_FILE)


def firefox_roots() -> list[Path]:
    system = platform.system()
    if system == "Windows":
        return [Path(os.environ.get("APPDATA", Path.home() / "AppData/Roaming")) / "Mozilla/Firefox/Profiles"]
    if system == "Darwin":
        return [Path.home() / "Library/Application Support/Firefox/Profiles"]
    return [
        Path.home() / "snap/firefox/common/.mozilla/firefox",
        Path.home() / ".mozilla/firefox",
        Path.home() / ".var/app/org.mozilla.firefox/.mozilla/firefox",
    ]


def firefox_binary(config: dict[str, Any]) -> str:
    configured = config.get("firefox_binary")
    if configured and Path(configured).exists():
        return configured
    if platform.system() == "Windows":
        candidates = [
            os.environ.get("PROGRAMFILES", "") + r"\\Mozilla Firefox\\firefox.exe",
            os.environ.get("PROGRAMFILES(X86)", "") + r"\\Mozilla Firefox\\firefox.exe",
        ]
    elif platform.system() == "Darwin":
        candidates = ["/Applications/Firefox.app/Contents/MacOS/firefox"]
    else:
        candidates = ["/usr/bin/firefox", "/snap/bin/firefox", "/usr/local/bin/firefox"]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    return "firefox"


def discover_profiles() -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    seen: set[str] = set()
    for root in firefox_roots():
        if not root.exists():
            continue
        try:
            for p in root.iterdir():
                if not p.is_dir() or str(p) in seen:
                    continue
                if ".Profile" in p.name or ".default" in p.name or ".default-release" in p.name:
                    seen.add(str(p))
                    found.append({"name": p.name, "path": str(p)})
        except OSError:
            continue
    found.sort(key=lambda x: x["name"].lower())
    return found


class Engine:
    def __init__(self) -> None:
        self.config = load_config()
        self.lock = threading.RLock()
        self.loop = asyncio.new_event_loop()
        self.loop_thread = threading.Thread(target=self._loop_main, daemon=True, name="brainbox-engine-loop")
        self.loop_thread.start()
        self.servers: dict[str, asyncio.AbstractServer] = {}
        self.processes: dict[str, subprocess.Popen[Any]] = {}
        self.webdriver: dict[str, dict[str, Any]] = {}
        self.next_refresh_at: dict[str, float] = {}
        self.last_refresh_at: dict[str, str] = {}
        self.started_at: dict[str, str] = {}
        self.events: list[dict[str, Any]] = []
        self.engine_running = False
        self.starting = False
        self._log("system", "Brainbox engine ready")
        self.refresh_thread = threading.Thread(target=self._refresh_loop, daemon=True, name="brainbox-refresh-loop")
        self.refresh_thread.start()

    def _loop_main(self) -> None:
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def _log(self, kind: str, message: str, profile_name: str | None = None) -> None:
        event = {"id": uuid.uuid4().hex, "kind": kind, "message": message, "timestamp": now_iso()}
        if profile_name:
            event["profileName"] = profile_name
        with self.lock:
            self.events.insert(0, event)
            self.events = self.events[:150]

    def reload(self) -> None:
        with self.lock:
            self.config = load_config()

    def profiles(self) -> list[dict[str, Any]]:
        self.reload()
        return self.config.get("profiles", [])

    def profile_by_id(self, pid: str) -> tuple[int, dict[str, Any]]:
        profiles = self.profiles()
        for i, p in enumerate(profiles):
            if p.get("id", f"p{p.get('local_port', i + 1)}") == pid:
                return i, p
        raise KeyError(pid)

    def _profile_id(self, index: int, p: dict[str, Any]) -> str:
        return str(p.get("id") or f"p{p.get('local_port', index + 1)}")

    def _profile_path(self, p: dict[str, Any]) -> Path:
        roots = firefox_roots()
        requested = p.get("firefox_profile", "")
        if Path(requested).is_absolute():
            return Path(requested)
        for root in roots:
            candidate = root / requested
            if candidate.exists():
                return candidate
        return roots[0] / requested

    async def _pipe(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            while True:
                data = await reader.read(65536)
                if not data:
                    break
                writer.write(data)
                await writer.drain()
        except Exception:
            pass
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

    async def _proxy_connection(self, client_reader: asyncio.StreamReader, client_writer: asyncio.StreamWriter, p: dict[str, Any]) -> None:
        try:
            upstream_reader, upstream_writer = await asyncio.open_connection(p["proxy_host"], int(p["proxy_port"]))
            request = await client_reader.read(65536)
            if not request:
                client_writer.close()
                return
            first_line = request.split(b"\r\n", 1)[0]
            credentials = f'{p.get("username", "")}:{p.get("password", "")}'.encode()
            auth = base64.b64encode(credentials)
            lines = request.split(b"\r\n")
            new_lines = [lines[0]]
            for line in lines[1:]:
                if not line.lower().startswith(b"proxy-authorization:"):
                    new_lines.append(line)
            new_lines.insert(1, b"Proxy-Authorization: Basic " + auth)
            request = b"\r\n".join(new_lines)
            upstream_writer.write(request)
            await upstream_writer.drain()
            if first_line.startswith(b"CONNECT "):
                response = await upstream_reader.read(65536)
                client_writer.write(response)
                await client_writer.drain()
                if response.startswith(b"HTTP/1.1 200") or response.startswith(b"HTTP/1.0 200"):
                    await asyncio.gather(self._pipe(client_reader, upstream_writer), self._pipe(upstream_reader, client_writer))
            else:
                await asyncio.gather(self._pipe(client_reader, upstream_writer), self._pipe(upstream_reader, client_writer))
        except Exception as exc:
            self._log("error", f"Proxy error: {exc}", p.get("name"))
        finally:
            try:
                client_writer.close()
            except Exception:
                pass

    async def _start_proxy(self, pid: str, p: dict[str, Any]) -> None:
        if pid in self.servers:
            return
        server = await asyncio.start_server(
            lambda r, w: self._proxy_connection(r, w, p), HOST, int(p["local_port"])
        )
        self.servers[pid] = server
        self._log("auth", f"Proxy bridge ready on 127.0.0.1:{p['local_port']}", p.get("name"))

    async def _stop_proxy(self, pid: str) -> None:
        server = self.servers.pop(pid, None)
        if server:
            server.close()
            await server.wait_closed()

    def _configure_proxy(self, p: dict[str, Any]) -> bool:
        path = self._profile_path(p)
        prefs = path / "prefs.js"
        if not path.exists():
            self._log("error", f"Firefox profile missing: {path}", p.get("name"))
            return False
        try:
            lines = prefs.read_text(errors="ignore").splitlines(True) if prefs.exists() else []
            keys = ["network.proxy.type", "network.proxy.http", "network.proxy.http_port", "network.proxy.ssl", "network.proxy.ssl_port", "network.proxy.no_proxies_on"]
            filtered = [line for line in lines if not any(f'user_pref("{key}"' in line for key in keys)]
            filtered.extend([
                'user_pref("network.proxy.type", 1);\n',
                'user_pref("network.proxy.http", "127.0.0.1");\n',
                f'user_pref("network.proxy.http_port", {int(p["local_port"])});\n',
                'user_pref("network.proxy.ssl", "127.0.0.1");\n',
                f'user_pref("network.proxy.ssl_port", {int(p["local_port"])});\n',
                'user_pref("network.proxy.no_proxies_on", "");\n',
            ])
            prefs.write_text("".join(filtered))
            return True
        except Exception as exc:
            self._log("error", f"Could not configure Firefox proxy: {exc}", p.get("name"))
            return False

    def _geckodriver_binary(self) -> str:
        configured = self.config.get("geckodriver_binary")
        if configured and Path(configured).exists():
            return configured
        candidates: list[Path] = []
        exe = "geckodriver.exe" if platform.system() == "Windows" else "geckodriver"
        candidates.append(BASE / exe)
        candidates.append(Path(__file__).resolve().parent / exe)
        meipass = getattr(sys, "_MEIPASS", None)
        if meipass:
            candidates.append(Path(meipass) / exe)
        for candidate in candidates:
            if candidate.exists():
                return str(candidate)
        return exe

    def _webdriver_request(self, pid: str, method: str, suffix: str = "", payload: dict[str, Any] | None = None) -> Any:
        session = self.webdriver.get(pid)
        if not session:
            raise RuntimeError("Browser automation session is not available")
        url = f"http://127.0.0.1:{session['port']}{suffix}"
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=12) as response:
            raw = response.read()
            return json.loads(raw.decode("utf-8")) if raw else {}

    def _refresh_profile_tabs(self, pid: str, p: dict[str, Any]) -> int:
        if pid not in self.webdriver:
            return 0
        try:
            handles = self._webdriver_request(pid, "GET", f"/session/{self.webdriver[pid]['session']}/window/handles")
            handles = handles.get("value", [])
            refreshed = 0
            for handle in handles:
                self._webdriver_request(pid, "POST", f"/session/{self.webdriver[pid]['session']}/window", {"handle": handle})
                self._webdriver_request(pid, "POST", f"/session/{self.webdriver[pid]['session']}/refresh", {})
                refreshed += 1
            if refreshed:
                self.last_refresh_at[pid] = now_iso()
                self._log("page-load", f"Auto-refreshed {refreshed} tab{'s' if refreshed != 1 else ''}", p.get("name"))
            return refreshed
        except Exception as exc:
            self._log("error", f"Tab refresh failed: {exc}", p.get("name"))
            return 0

    def _schedule_next_refresh(self, pid: str) -> None:
        minimum = max(5, int(self.config.get("refresh_min_minutes", 5)))
        maximum = max(minimum, int(self.config.get("refresh_max_minutes", 15)))
        self.next_refresh_at[pid] = time.time() + random.randint(minimum * 60, maximum * 60)

    def _refresh_loop(self) -> None:
        while True:
            time.sleep(10)
            try:
                self.config = load_config()
                if not bool(self.config.get("refresh_enabled", False)):
                    continue
                now = time.time()
                for pid, session in list(self.webdriver.items()):
                    if now >= self.next_refresh_at.get(pid, now + 60):
                        _, p = self.profile_by_id(pid)
                        self._refresh_profile_tabs(pid, p)
                        self._schedule_next_refresh(pid)
            except Exception as exc:
                self._log("error", f"Refresh monitor error: {exc}")

    def _launch_process(self, pid: str, p: dict[str, Any]) -> None:
        path = self._profile_path(p)
        if not path.exists():
            raise FileNotFoundError(f"Firefox profile missing: {path}")
        binary = firefox_binary(self.config)
        driver = self._geckodriver_binary()
        driver_port = int(p.get("webdriver_port") or (9510 + int(p.get("local_port", 0)) - 9100))
        kwargs: dict[str, Any] = {"stdin": subprocess.DEVNULL, "stdout": subprocess.PIPE, "stderr": subprocess.DEVNULL, "text": True}
        if platform.system() == "Windows":
            kwargs["creationflags"] = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
        else:
            kwargs["start_new_session"] = True
        proc = subprocess.Popen([driver, "--port", str(driver_port), "--binary", binary, "--log", "fatal"], **kwargs)
        self.processes[pid] = proc
        try:
            deadline = time.time() + 15
            while time.time() < deadline:
                try:
                    req = urllib.request.Request(f"http://127.0.0.1:{driver_port}/status")
                    with urllib.request.urlopen(req, timeout=1) as response:
                        if response.status == 200:
                            break
                except Exception:
                    time.sleep(0.15)
            else:
                raise RuntimeError("geckodriver did not start")
            payload = {
                "capabilities": {
                    "alwaysMatch": {
                        "browserName": "firefox",
                        "moz:firefoxOptions": {
                            "binary": binary,
                            "args": ["--profile", str(path)],
                        },
                    }
                }
            }
            req = urllib.request.Request(f"http://127.0.0.1:{driver_port}/session", data=json.dumps(payload).encode(), method="POST", headers={"Content-Type":"application/json"})
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
            session_id = result.get("value", {}).get("sessionId") or result.get("sessionId")
            if not session_id:
                raise RuntimeError(f"geckodriver failed to create session: {result}")
            self.webdriver[pid] = {"port": driver_port, "session": session_id}
            target = p.get("targetWebsite") or self.config.get("website", "https://www.fiverr.com/users/manage_gigs")
            self._webdriver_request(pid, "POST", f"/session/{session_id}/url", {"url": target})
            self.started_at[pid] = now_iso()
            self._schedule_next_refresh(pid)
            self._log("browser-open", "Firefox profile launched with tab monitoring", p.get("name"))
        except Exception:
            try:
                proc.terminate()
            except Exception:
                pass
            self.processes.pop(pid, None)
            raise

    def _stop_process(self, pid: str, p: dict[str, Any]) -> None:
        session = self.webdriver.get(pid)
        if session:
            try:
                req = urllib.request.Request(f"http://127.0.0.1:{session['port']}/session/{session['session']}", method="DELETE")
                urllib.request.urlopen(req, timeout=5).close()
            except Exception:
                pass
            self.webdriver.pop(pid, None)
        proc = self.processes.pop(pid, None)
        self.next_refresh_at.pop(pid, None)
        if proc:
            try:
                if platform.system() == "Windows":
                    subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    os.killpg(proc.pid, 15)
            except Exception:
                try:
                    proc.terminate()
                except Exception:
                    pass
        self._log("stop", "Firefox profile stopped", p.get("name"))

    def _submit(self, coro: Any) -> None:
        fut = asyncio.run_coroutine_threadsafe(coro, self.loop)
        fut.result(timeout=20)

    def start_profile(self, pid: str) -> None:
        idx, p = self.profile_by_id(pid)
        with self.lock:
            self.config = load_config()
        if pid in self.processes and self.processes[pid].poll() is None:
            return
        if not self._configure_proxy(p):
            raise RuntimeError("Firefox profile could not be configured")
        self._submit(self._start_proxy(pid, p))
        time.sleep(0.15)
        self._launch_process(pid, p)
        self.engine_running = True

    def stop_profile(self, pid: str) -> None:
        _, p = self.profile_by_id(pid)
        self._stop_process(pid, p)
        self._submit(self._stop_proxy(pid))
        self.engine_running = bool(self.processes or self.servers)

    def start_all(self) -> None:
        if self.starting:
            return
        self.starting = True
        self._log("launch", "Starting configured Firefox profiles")
        try:
            profiles = self.profiles()
            for i, p in enumerate(profiles):
                pid = self._profile_id(i, p)
                try:
                    self.start_profile(pid)
                except Exception as exc:
                    self._log("error", f"Launch failed: {exc}", p.get("name"))
                if i < len(profiles) - 1:
                    delay = max(0, int(self.config.get("startup_delay", 12)))
                    if delay:
                        time.sleep(delay)
            self._log("launch", "Startup sequence complete")
        finally:
            self.starting = False

    def stop_all(self) -> None:
        for i, p in enumerate(self.profiles()):
            pid = self._profile_id(i, p)
            try:
                self.stop_profile(pid)
            except Exception as exc:
                self._log("error", f"Stop failed: {exc}", p.get("name"))
        self.engine_running = False
        self._log("stop", "All profiles stopped")

    def restart_all(self) -> None:
        self.stop_all()
        self.start_all()

    def test_proxy(self, pid: str) -> dict[str, Any]:
        _, p = self.profile_by_id(pid)
        start = time.perf_counter()
        user = urllib.parse.quote(str(p.get("username", "")), safe="")
        pw = urllib.parse.quote(str(p.get("password", "")), safe="")
        proxy_url = f"http://{user}:{pw}@{p['proxy_host']}:{int(p['proxy_port'])}"
        handler = urllib.request.ProxyHandler({"http": proxy_url, "https": proxy_url})
        opener = urllib.request.build_opener(handler)
        req = urllib.request.Request("https://api.ipify.org", headers={"User-Agent": "BrainboxFirefoxManager/1.0"})
        try:
            with opener.open(req, timeout=12) as response:
                ip = response.read().decode().strip()
            latency = int((time.perf_counter() - start) * 1000)
            self._log("auth", f"Proxy test passed • {ip} • {latency} ms", p.get("name"))
            return {"ok": True, "externalIp": ip, "latencyMs": latency}
        except Exception as exc:
            self._log("error", f"Proxy test failed: {exc}", p.get("name"))
            return {"ok": False, "externalIp": "—", "latencyMs": 0, "error": str(exc)}

    def snapshot(self) -> dict[str, Any]:
        self.reload()
        profiles = self.config.get("profiles", [])
        out: list[dict[str, Any]] = []
        running = set()
        for i, p in enumerate(profiles):
            pid = self._profile_id(i, p)
            proc = self.processes.get(pid)
            if proc and proc.poll() is None:
                running.add(pid)
        for i, p in enumerate(profiles):
            pid = self._profile_id(i, p)
            proxy_ok = p.get("proxy_status", "unknown")
            out.append({
                "id": pid,
                "accountName": p.get("name", f"Profile {i+1}"),
                "countryCode": p.get("country_code", ""),
                "countryName": p.get("country_name", ""),
                "status": "running" if pid in running else ("error" if proxy_ok == "failed" else "stopped"),
                "proxyHost": p.get("proxy_host", ""),
                "proxyPort": int(p.get("proxy_port", 0)),
                "proxyUsername": "••••••••" if p.get("username") else "",
                "proxyPassword": "",
                "proxyStatus": proxy_ok if proxy_ok in {"healthy", "slow", "failed"} else "failed",
                "latencyMs": int(p.get("latency_ms", 0)),
                "externalIp": p.get("external_ip", "—"),
                "firefoxProfileName": p.get("firefox_profile", ""),
                "targetWebsite": p.get("targetWebsite") or self.config.get("website", "https://www.fiverr.com/users/manage_gigs"),
                "lastLaunched": self.started_at.get(pid, "Unknown"),
                "lastRefreshed": self.last_refresh_at.get(pid, "Unknown"),
                "nextRefreshAt": datetime.fromtimestamp(self.next_refresh_at[pid], timezone.utc).isoformat() if pid in self.next_refresh_at else None,
                "startupDelaySeconds": int(p.get("startup_delay", self.config.get("startup_delay", 12))),
                "launchOnStartup": bool(p.get("launch_on_startup", True)),
            })
        system = platform.system()
        autostart = self.autostart_enabled()
        return {
            "engineOnline": True,
            "platform": "Windows" if system == "Windows" else "Ubuntu / Linux" if system == "Linux" else system,
            "autostart": autostart,
            "profiles": out,
            "activity": list(self.events),
            "discoveredFirefoxProfiles": [
                {"id": f"fp{i}", "name": item["name"], "inUse": any(item["name"] == p.get("firefox_profile") for p in profiles)}
                for i, item in enumerate(discover_profiles())
            ],
            "settings": {
                "workspaceName": self.config.get("workspace_name", "Brainbox"),
                "firefoxBinary": firefox_binary(self.config),
                "launchOnLogin": autostart,
                "launchAllAuto": bool(self.config.get("launch_all_auto", True)),
                "startupDelay": int(self.config.get("startup_delay", 12)),
                "defaultSite": self.config.get("website", "https://www.fiverr.com/users/manage_gigs"),
                "theme": self.config.get("theme", "dark"),
                "notifyProxyFail": bool(self.config.get("notify_proxy_fail", True)),
                "notifyLaunch": bool(self.config.get("notify_launch", False)),
                "refreshEnabled": bool(self.config.get("refresh_enabled", False)),
                "refreshMinMinutes": max(5, int(self.config.get("refresh_min_minutes", 5))),
                "refreshMaxMinutes": max(5, int(self.config.get("refresh_max_minutes", 15))),
            },
        }

    def autostart_enabled(self) -> bool:
        if platform.system() == "Linux":
            unit = Path.home() / ".config/systemd/user/brainbox-browser.service"
            return unit.exists()
        if platform.system() == "Windows":
            return (Path(os.environ.get("APPDATA", Path.home())) / "Microsoft/Windows/Start Menu/Programs/Startup/BrainboxFirefoxManager.cmd").exists()
        return False

    def set_settings(self, s: dict[str, Any]) -> None:
        self.config = load_config()
        self.config["workspace_name"] = s.get("workspaceName", "Brainbox")
        self.config["firefox_binary"] = s.get("firefoxBinary", self.config.get("firefox_binary", ""))
        self.config["launch_all_auto"] = bool(s.get("launchAllAuto", True))
        self.config["startup_delay"] = max(0, int(s.get("startupDelay", 12)))
        self.config["website"] = s.get("defaultSite", self.config.get("website", ""))
        self.config["theme"] = s.get("theme", "dark")
        self.config["notify_proxy_fail"] = bool(s.get("notifyProxyFail", True))
        self.config["notify_launch"] = bool(s.get("notifyLaunch", False))
        self.config["refresh_enabled"] = bool(s.get("refreshEnabled", False))
        self.config["refresh_min_minutes"] = max(5, int(s.get("refreshMinMinutes", 5)))
        self.config["refresh_max_minutes"] = max(self.config["refresh_min_minutes"], int(s.get("refreshMaxMinutes", 15)))
        save_config(self.config)
        self._log("system", "Settings saved")

    def mutate_profile(self, pid: str | None, payload: dict[str, Any], duplicate: bool = False) -> None:
        self.config = load_config()
        profiles = self.config.setdefault("profiles", [])
        if pid is None:
            index = len(profiles)
            new = self._frontend_to_config(payload, index)
            profiles.append(new)
        else:
            idx, current = self.profile_by_id(pid)
            if duplicate:
                new = dict(current)
                new["id"] = None
                new["name"] = f"{current.get('name', 'Profile')} Copy"
                new["local_port"] = self._next_local_port(profiles)
                profiles.insert(idx + 1, new)
            else:
                profiles[idx] = self._frontend_to_config(payload, idx, current)
        save_config(self.config)
        self._log("system", "Profile configuration saved")

    def _next_local_port(self, profiles: list[dict[str, Any]]) -> int:
        used = {int(p.get("local_port", 0)) for p in profiles}
        port = 9101
        while port in used:
            port += 1
        return port

    def _frontend_to_config(self, p: dict[str, Any], index: int, current: dict[str, Any] | None = None) -> dict[str, Any]:
        current = current or {}
        return {
            "id": p.get("id") or current.get("id") or f"p{p.get('proxyPort', index + 1)}",
            "name": p.get("accountName", current.get("name", f"Profile {index + 1}")),
            "firefox_profile": p.get("firefoxProfileName", current.get("firefox_profile", "")),
            "local_port": int(p.get("localPort", current.get("local_port", self._next_local_port(self.config.get("profiles", []))))),
            "proxy_host": p.get("proxyHost", current.get("proxy_host", "")),
            "proxy_port": int(p.get("proxyPort", current.get("proxy_port", 0))),
            "username": (current.get("username", "") if str(p.get("proxyUsername", "")).startswith("•") else p.get("proxyUsername", current.get("username", ""))),
            "password": p.get("proxyPassword") or current.get("password", ""),
            "country_code": p.get("countryCode", current.get("country_code", "")),
            "country_name": p.get("countryName", current.get("country_name", "")),
            "targetWebsite": p.get("targetWebsite", current.get("targetWebsite", self.config.get("website", ""))),
            "launch_on_startup": bool(p.get("launchOnStartup", current.get("launch_on_startup", True))),
            "startup_delay": int(p.get("startupDelaySeconds", current.get("startup_delay", self.config.get("startup_delay", 12)))),
            "proxy_status": current.get("proxy_status", "failed"),
            "latency_ms": current.get("latency_ms", 0),
            "external_ip": current.get("external_ip", "—"),
        }


ENGINE = Engine()


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: Any) -> None:
    data = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(data)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    handler.end_headers()
    handler.wfile.write(data)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        return

    def do_OPTIONS(self) -> None:
        json_response(self, 204, {})

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self) -> None:
        if self.path == "/api/snapshot":
            json_response(self, 200, ENGINE.snapshot())
            return
        json_response(self, 404, {"error": "Not found"})

    def do_POST(self) -> None:
        try:
            path = self.path.rstrip("/")
            if path == "/api/start-all":
                threading.Thread(target=ENGINE.start_all, daemon=True).start()
            elif path == "/api/stop-all":
                ENGINE.stop_all()
            elif path == "/api/restart-all":
                threading.Thread(target=ENGINE.restart_all, daemon=True).start()
            elif path == "/api/proxies/test-all":
                for p in ENGINE.profiles():
                    try:
                        result = ENGINE.test_proxy(ENGINE._profile_id(ENGINE.profiles().index(p), p))
                        p["proxy_status"] = "healthy" if result["ok"] else "failed"
                        p["latency_ms"] = result.get("latencyMs", 0)
                        p["external_ip"] = result.get("externalIp", "—")
                    except Exception:
                        pass
                save_config(ENGINE.config)
            elif path.startswith("/api/profiles/"):
                parts = path.split("/")
                pid = urllib.parse.unquote(parts[3])
                action = parts[4] if len(parts) > 4 else ""
                if action == "launch": ENGINE.start_profile(pid)
                elif action == "stop": ENGINE.stop_profile(pid)
                elif action == "duplicate": ENGINE.mutate_profile(pid, {}, duplicate=True)
                elif action == "refresh":
                    _, p = ENGINE.profile_by_id(pid)
                    ENGINE._refresh_profile_tabs(pid, p)
                    ENGINE._schedule_next_refresh(pid)
                elif action == "test-proxy":
                    _, p = ENGINE.profile_by_id(pid)
                    result = ENGINE.test_proxy(pid)
                    p["proxy_status"] = "healthy" if result["ok"] else "failed"
                    p["latency_ms"] = result.get("latencyMs", 0)
                    p["external_ip"] = result.get("externalIp", "—")
                    save_config(ENGINE.config)
                else: raise KeyError(pid)
            elif path == "/api/profiles":
                ENGINE.mutate_profile(None, ENGINE._read_json if False else self.read_json())
            else:
                raise KeyError(path)
            json_response(self, 200, ENGINE.snapshot())
        except Exception as exc:
            json_response(self, 400, {"error": str(exc)})

    def do_PUT(self) -> None:
        try:
            path = self.path.rstrip("/")
            payload = self.read_json()
            if path == "/api/settings":
                ENGINE.set_settings(payload)
            elif path.startswith("/api/profiles/"):
                pid = urllib.parse.unquote(path.split("/")[3])
                ENGINE.mutate_profile(pid, payload)
            else:
                raise KeyError(path)
            json_response(self, 200, ENGINE.snapshot())
        except Exception as exc:
            json_response(self, 400, {"error": str(exc)})

    def do_DELETE(self) -> None:
        try:
            path = self.path.rstrip("/")
            if not path.startswith("/api/profiles/"):
                raise KeyError(path)
            pid = urllib.parse.unquote(path.split("/")[3])
            try:
                ENGINE.stop_profile(pid)
            except Exception:
                pass
            ENGINE.config = load_config()
            idx, _ = ENGINE.profile_by_id(pid)
            ENGINE.config["profiles"].pop(idx)
            save_config(ENGINE.config)
            ENGINE._log("system", "Profile removed")
            json_response(self, 200, ENGINE.snapshot())
        except Exception as exc:
            json_response(self, 400, {"error": str(exc)})


def stop_legacy_linux_service() -> None:
    """Prevent the pre-desktop systemd engine from occupying the API port."""
    if platform.system() != "Linux":
        return
    try:
        subprocess.run(
            ["systemctl", "--user", "stop", "brainbox-browser.service"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=5,
        )
    except Exception:
        pass


def main() -> None:
    stop_legacy_linux_service()
    server = ThreadingHTTPServer((HOST, API_PORT), Handler)
    print(f"Brainbox Firefox Manager API listening on http://{HOST}:{API_PORT}/api")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        ENGINE.loop.call_soon_threadsafe(ENGINE.loop.stop)


if __name__ == "__main__":
    main()
