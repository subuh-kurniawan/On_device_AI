#!/bin/bash
# =========================================================================
# Launch Chrome with AI Flags (Double-Click Launcher for macOS)
# =========================================================================
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

./launch_chrome_ai.sh
