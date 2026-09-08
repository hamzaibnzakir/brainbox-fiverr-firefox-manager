#!/usr/bin/env python3
"""Local-only desktop extensions for Brainbox Firefox Manager.

This entrypoint keeps the existing backend intact, while adding:
  * target URL normalization + post-navigation verification
  * raw authenticated HTTP CONNECT proxy tests
  * a standalone local proxy tester endpoint
  * bundled offline country lookup + local quality risk heuristic

No cloud API or remote application backend is used. Proxy tests only create
network traffic needed to verify the proxy tunnel itself.
"""
from __future__ import annotations

import base64
import bisect
import csv
import ipaddress
import json
import os
import platform
import socket
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from typing import Any

import backend

_GEO_LOCK = threading.Lock()
_GEO_STARTS: list[int] = []
_GEO_ENDS: list[int] = []
_GEO_CODES: list[str] = []
_GEO_LOADED = False


def _resource_path(name: str) -> Path | None:
    candidates: list[Path] = []
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        candidates.append(Path(meipass) / "data" / name)
    candidates.append(Path(__file__).resolve().parent / "data" / name)
    candidates.append(backend.BASE / "data" / name)
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def _load_geo() -> None:
    global _GEO_LOADED
    if _GEO_LOADED:
        return
    with _GEO_LOCK:
        if _GEO_LOADED:
            return
        path = _resource_path("user-country-ipv4-num.csv")
        if path:
            try:
                with path.open("r", encoding="utf-8", newline="") as handle:
                    for row in csv.reader(handle):
                        if len(row) < 3:
                            continue
                        try:
                            start = int(row[0].strip().strip('"'))
                            end = int(row[1].strip().strip('"'))
                        except ValueError:
                            continue
                        code = row[2].strip().strip('"').upper()
                        if len(code) != 2:
                            continue
                        _GEO_STARTS.append(start)
                        _GEO_ENDS.append(end)
                        _GEO_CODES.append(code)
            except Exception:
                _GEO_STARTS.clear()
                _GEO_ENDS.clear()
                _GEO_CODES.clear()
        _GEO_LOADED = True


def _country_code_for_ip(ip_text: str) -> str:
    try:
        ip = ipaddress.ip_address(ip_text)
    except ValueError:
        return ""
    if ip.version != 4:
        return ""
    _load_geo()
    if not _GEO_STARTS:
        return ""
    value = int(ip)
    idx = bisect.bisect_right(_GEO_STARTS, value) - 1
    if idx >= 0 and value <= _GEO_ENDS[idx]:
        return _GEO_CODES[idx]
    return ""


def _normalize_target(raw: Any) -> str:
    target = str(raw or "").strip()
    if not target:
        target = "https://www.fiverr.com/users/manage_gigs"
    parsed = urllib.parse.urlparse(target)
    if not parsed.scheme:
        target = "https://" + target
        parsed = urllib.parse.urlparse(target)
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Target website must be a valid http or https URL")
    return target


def _resolved_public_ip(host: str) -> tuple[str, bool]:
    try:
        resolved = socket.gethostbyname(host.strip())
        ip = ipaddress.ip_address(resolved)
        return resolved, bool(ip.is_global)
    except Exception:
        return host.strip(), False


def _risk_for_result(ok: bool, latency_ms: int, public_ip: bool, country_code: str) -> tuple[int, str, list[str]]:
    if not ok:
        return 100, "high", ["Proxy tunnel could not be established"]
    score = 8
    flags: list[str] = []
    if latency_ms > 3000:
        score += 38
        flags.append("Very high connection latency")
    elif latency_ms > 1500:
        score += 24
        flags.append("High connection latency")
    elif latency_ms > 800:
        score += 12
        flags.append("Moderate connection latency")
    if not public_ip:
        score += 38
        flags.append("Proxy host is not detected as a public IP")
    if not country_code:
        score += 8
        flags.append("Country could not be resolved from the bundled local database")
    score = min(100, score)
    level = "low" if score < 35 else "medium" if score < 70 else "high"
    return score, level, flags


def _probe_proxy(payload: dict[str, Any]) -> dict[str, Any]:
    host = str(payload.get("host") or payload.get("proxyHost") or payload.get("proxy_host") or "").strip()
    port_raw = payload.get("port") or payload.get("proxyPort") or payload.get("proxy_port")
    username = str(payload.get("username") or payload.get("proxyUsername") or "")
    password = str(payload.get("password") or payload.get("proxyPassword") or "")
    if not host:
        raise ValueError("Proxy host is required")
    try:
        port = int(port_raw)
    except Exception as exc:
        raise ValueError("Proxy port is required") from exc
    if port < 1 or port > 65535:
        raise ValueError("Proxy port must be between 1 and 65535")

    proxy_ip, public_ip = _resolved_public_ip(host)
    country_code = _country_code_for_ip(proxy_ip)
    started = time.perf_counter()
    sock: socket.socket | None = None
    try:
        sock = socket.create_connection((host, port), timeout=12)
        auth_line = ""
        if username or password:
            token = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
            auth_line = f"Proxy-Authorization: Basic {token}\r\n"
        request = (
            "CONNECT example.com:443 HTTP/1.1\r\n"
            "Host: example.com:443\r\n"
            "User-Agent: BrainboxFirefoxManager/1.1\r\n"
            "Proxy-Connection: close\r\n"
            f"{auth_line}\r\n"
        ).encode("ascii", errors="ignore")
        sock.sendall(request)
        response = b""
        while b"\r\n\r\n" not in response and len(response) < 32768:
            chunk = sock.recv(4096)
            if not chunk:
                break
            response += chunk
        first_line = response.split(b"\r\n", 1)[0].decode("latin-1", errors="replace")
        parts = first_line.split()
        status = int(parts[1]) if len(parts) >= 2 and parts[1].isdigit() else 0
        latency_ms = int((time.perf_counter() - started) * 1000)
        ok = status == 200
        score, level, flags = _risk_for_result(ok, latency_ms, public_ip, country_code)
        if not ok:
            error = first_line or "Proxy returned no valid HTTP response"
            if status == 407:
                error = "Proxy authentication failed"
            elif status:
                error = f"Proxy CONNECT failed with HTTP {status}"
            return {
                "ok": False,
                "proxyIp": proxy_ip,
                "externalIp": proxy_ip,
                "latencyMs": latency_ms,
                "countryCode": country_code,
                "httpsTunnel": False,
                "publicIp": public_ip,
                "riskScore": score,
                "riskLevel": level,
                "flags": flags,
                "source": "local",
                "error": error,
            }
        return {
            "ok": True,
            "proxyIp": proxy_ip,
            "externalIp": proxy_ip,
            "latencyMs": latency_ms,
            "countryCode": country_code,
            "httpsTunnel": True,
            "publicIp": public_ip,
            "riskScore": score,
            "riskLevel": level,
            "flags": flags,
            "source": "local",
        }
    except Exception as exc:
        latency_ms = int((time.perf_counter() - started) * 1000)
        score, level, flags = _risk_for_result(False, latency_ms, public_ip, country_code)
        return {
            "ok": False,
            "proxyIp": proxy_ip,
            "externalIp": proxy_ip,
            "latencyMs": latency_ms,
            "countryCode": country_code,
            "httpsTunnel": False,
            "publicIp": public_ip,
            "riskScore": score,
            "riskLevel": level,
            "flags": flags,
            "source": "local",
            "error": str(exc),
        }
    finally:
        if sock:
            try:
                sock.close()
            except Exception:
                pass


def _persist_proxy_result(engine: backend.Engine, pid: str, result: dict[str, Any]) -> None:
    engine.config = backend.load_config()
    profiles = engine.config.get("profiles", [])
    for i, profile in enumerate(profiles):
        current_id = engine._profile_id(i, profile)
        if current_id != pid:
            continue
        if result.get("ok"):
            profile["proxy_status"] = "slow" if int(result.get("latencyMs", 0)) > 2500 else "healthy"
        else:
            profile["proxy_status"] = "failed"
        profile["latency_ms"] = int(result.get("latencyMs", 0))
        profile["external_ip"] = result.get("proxyIp", "—")
        if result.get("countryCode"):
            profile["country_code"] = str(result["countryCode"]).lower()
        break
    backend.save_config(engine.config)


def _test_proxy(self: backend.Engine, pid: str) -> dict[str, Any]:
    _, profile = self.profile_by_id(pid)
    result = _probe_proxy({
        "host": profile.get("proxy_host", ""),
        "port": profile.get("proxy_port", 0),
        "username": profile.get("username", ""),
        "password": profile.get("password", ""),
    })
    _persist_proxy_result(self, pid, result)
    if result.get("ok"):
        self._log("auth", f"Proxy test passed • {result.get('proxyIp', '—')} • {result.get('latencyMs', 0)} ms", profile.get("name"))
    else:
        self._log("error", f"Proxy test failed: {result.get('error', 'Unknown error')}", profile.get("name"))
    return result


def _launch_process(self: backend.Engine, pid: str, profile: dict[str, Any]) -> None:
    path = self._profile_path(profile)
    if not path.exists():
        raise FileNotFoundError(f"Firefox profile missing: {path}")
    binary = backend.firefox_binary(self.config)
    driver = self._geckodriver_binary()
    driver_port = int(profile.get("webdriver_port") or (9510 + int(profile.get("local_port", 0)) - 9100))
    kwargs: dict[str, Any] = {
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.PIPE,
        "stderr": subprocess.DEVNULL,
        "text": True,
    }
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
        req = urllib.request.Request(
            f"http://127.0.0.1:{driver_port}/session",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
        session_id = result.get("value", {}).get("sessionId") or result.get("sessionId")
        if not session_id:
            raise RuntimeError(f"geckodriver failed to create session: {result}")
        self.webdriver[pid] = {"port": driver_port, "session": session_id}

        target = _normalize_target(profile.get("targetWebsite") or self.config.get("website"))
        before = ""
        try:
            current = self._webdriver_request(pid, "GET", f"/session/{session_id}/url")
            before = str(current.get("value") or "")
        except Exception:
            pass

        self._webdriver_request(pid, "POST", f"/session/{session_id}/url", {"url": target})
        time.sleep(0.6)
        current = self._webdriver_request(pid, "GET", f"/session/{session_id}/url")
        actual = str(current.get("value") or "")
        if before and actual == before:
            self._webdriver_request(pid, "POST", f"/session/{session_id}/url", {"url": target})
            time.sleep(0.6)
            current = self._webdriver_request(pid, "GET", f"/session/{session_id}/url")
            actual = str(current.get("value") or "")
        if before and actual == before:
            raise RuntimeError(f"Firefox opened but did not navigate to {target}")

        self.started_at[pid] = backend.now_iso()
        self._schedule_next_refresh(pid)
        self._log("browser-open", f"Opened {actual or target}", profile.get("name"))
    except Exception:
        try:
            proc.terminate()
        except Exception:
            pass
        self.processes.pop(pid, None)
        self.webdriver.pop(pid, None)
        raise


backend.Engine.test_proxy = _test_proxy
backend.Engine._launch_process = _launch_process


class LocalHandler(backend.Handler):
    def do_POST(self) -> None:
        path = self.path.rstrip("/")
        try:
            if path == "/api/proxy-tester":
                result = _probe_proxy(self.read_json())
                backend.json_response(self, 200, result)
                return
            if path == "/api/proxies/test-all":
                profiles = backend.ENGINE.profiles()
                ids = [backend.ENGINE._profile_id(i, p) for i, p in enumerate(profiles)]
                for pid in ids:
                    backend.ENGINE.test_proxy(pid)
                backend.json_response(self, 200, backend.ENGINE.snapshot())
                return
            if path.startswith("/api/profiles/") and path.endswith("/test-proxy"):
                pid = urllib.parse.unquote(path.split("/")[3])
                backend.ENGINE.test_proxy(pid)
                backend.json_response(self, 200, backend.ENGINE.snapshot())
                return
            super().do_POST()
        except Exception as exc:
            backend.json_response(self, 400, {"error": str(exc)})


def main() -> None:
    backend.stop_legacy_linux_service()
    server = ThreadingHTTPServer((backend.HOST, backend.API_PORT), LocalHandler)
    print(f"Brainbox Firefox Manager API listening on http://{backend.HOST}:{backend.API_PORT}/api")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        backend.ENGINE.loop.call_soon_threadsafe(backend.ENGINE.loop.stop)


if __name__ == "__main__":
    main()
