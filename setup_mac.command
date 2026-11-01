#!/bin/bash
# =========================================================================
# Setup & Dependency Installer (Double-Click Launcher for macOS)
# =========================================================================
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

./setup.sh
