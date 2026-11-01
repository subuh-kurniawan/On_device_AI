# 📋 Changelog

<div align="center">
  <p>
    <b><a href="CHANGELOG.md">🇮🇩 Bahasa Indonesia</a> | 🇬🇧 English</b>
  </p>
</div>

All notable changes to the **Chrome On-Device AI Playground** project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [2.0.0] - 2026-11-02

### ✨ Added
- **Multi-Platform Chrome Edition Detector & AI Flags Launcher (`launch_chrome_ai.sh`, `launch_chrome_mac.command`, `launch_chrome_ai.bat`)**:
  - Automatically detects installed Chrome variants: **Chrome Canary**, **Chrome Dev**, **Chrome Beta**, and **Chrome Stable**.
  - Intelligently prioritizes the optimal channel (prioritizing Dev/Canary containing the newest On-Device APIs).
  - Automatically audits system hardware specs (RAM & free storage); automatically enables `BypassPerfRequirement` if system RAM is below 16 GB.
  - Injects all essential flags (`OptimizationGuideOnDeviceModel`, `PromptAPIForGeminiNano`, `EnableWebGPU`, etc.) using an isolated AI profile directory so flags activate with 100% reliability without disturbing ongoing browser sessions.
  - Automatically opens the application portal, `chrome://components`, and `chrome://on-device-internals`.
- **Automated Cross-Platform Dependency & SSL Setup Scripts (`setup.sh`, `setup_mac.command`, `setup.bat`, `package.json`)**:
  - Complete automation for **macOS**, **Linux** (Ubuntu/Debian, Fedora, Arch), and **Windows**.
  - Automatic detection and installation of Node.js, Python 3, OpenSSL, and Git LFS (via Homebrew on Mac, APT/DNF/Pacman on Linux, and WinGet on Windows).
  - Automated local SSL certificate generation (`cert.pem` & `key.pem`) configured with multi-SAN attributes for `localhost`, `127.0.0.1`, and host LAN IP.
  - Automatic Git LFS initialization to download onnx model weights upon clone.
  - Standardized `package.json` with `npm run setup`, `npm run launch`, `npm start`, and `npm run serve`.
- **macOS Native Swift GUI Launcher (`jalankanserverFN.command` & `jalankanserverFN_gui.swift`)**:
  - Native macOS graphical control panel auto-compiled via `swiftc`.
  - Realtime monitoring of SSL HTTPS status (`cert.pem` & `key.pem`), active ports, LAN QR codes, and server logs.
- **One-Click Git Push Script (`git_push.command`)**:
  - Automated double-click bash script for macOS Finder automating `git add`, `git commit`, and `git push`.
  - Integrates with macOS Keychain (`osxkeychain`) for zero-password push operations.
- **LAN AI Relay & Bridge Server (`lan-ai-bridge.js`, `lan-ai-relay-server.js`, `relay.js`)**:
  - Enables client devices (smartphones/tablets on the same local Wi-Fi/LAN) to leverage host Chrome On-Device AI inference over secure WebSocket and HTTPS.
  - Auto-generates local self-signed SSL certificates (`key.pem` and `cert.pem`) required by mobile Web APIs.
- **Git LFS Integration for Large ONNX Models**:
  - Configured `.gitattributes` to manage large `.onnx` model files via Git LFS.
  - Added high-precision multilingual embedding model `intfloat/multilingual-e5-small` (113 MB) and lightweight `all-MiniLM-L6-v2` (22 MB).
- **Interactive UI & Visual Enhancements**:
  - `ai-mermaid-controls.js`: Interactive controls for Mermaid diagrams (zoom in/out, pan drag, copy SVG, and fullscreen).
  - `intent-enricher.js`: Automated prompt intent analysis dynamically formatting responses as diagrams, tables, charts, mindmaps, or KaTeX formulas.
  - `context-memory-manager.js`: Cross-session chat memory archival into IndexedDB (`kb_chunks` and `kb_files`).
  - `python-runner.js`: In-browser runner for executing Python code snippets.
  - Added preview thumbnails for all SPA modules under `nano_asset/assets/previews/`.
- **AI Persona Documentation (`chat.md`)**:
  - Comprehensive persona and system prompt guidelines for the Local AI Playground chatbot.

### 🔄 Changed
- **Directory Structure & Asset Reorganization**:
  - Reorganized all static assets, KaTeX fonts, cover graphics, and AI models into `nano_asset/`.
  - Cleaned up obsolete duplicate files from root directory.
- **Responsive Layout & Visual Theming**:
  - Added `responsive.css` and `ai-renderers.css` for mobile-friendly browsing when accessed over LAN.
  - Enhanced KaTeX and CodeMirror themes for optimized contrast in Dark Mode.

### 🛡️ Security
- Strengthened `.gitignore` rules to keep private certificates (`*.pem`), precompiled local binaries, and macOS metadata (`.DS_Store`) strictly out of git history.

---

## [1.5.0] - 2026-10-16

### ✨ Added
- Chrome Built-in AI (`window.ai` / Prompt API) integration for Gemini Nano.
- Multi-provider chat interface `obrolan-claude.html` supporting Gemini Nano, local Ollama, and OpenAI-compatible endpoints.
- In-browser client-side RAG utilizing Transformers.js (`all-MiniLM-L6-v2`).
- Integrated document parsers for PDF, DOCX, TXT, and Markdown.
- Automated launch scripts `start_mac.command` and `start_windows.bat`.

---

## [1.0.0] - 2026-08-27

### ✨ Initial Release
- Initial prototype of the Chrome On-Device AI Playground.
- Implementation of the WebGPU LiteRT-LM Engine (`mesin-litert-lm.html`).
- Foundational user interfaces for code analysis and vision analysis.
