#!/usr/bin/env python3
"""Packaged desktop sidecar entrypoint with runtime hardening."""

import desktop_backend
import desktop_patches


desktop_patches.apply()
desktop_backend.main()
