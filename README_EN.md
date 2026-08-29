# 🚀 Chrome On-Device AI Playground (V1.5.0)

<div align="center">
  <p>
    <b><a href="README.md">🇮🇩 Bahasa Indonesia</a> | 🇬🇧 English</b>
  </p>
  <img width="100%" alt="Screenshot 2026-08-27 at 18 05 38" src="https://github.com/user-attachments/assets/a2c87635-7af2-45d2-83a3-39fbf10527a9" />
  <p><em>A collection of experiments and prototype Client-Side AI applications that run 100% locally in your browser, without a backend server, without API costs, and with guaranteed data privacy.</em></p>
</div>

---

## 📑 Table of Contents
- [🚀 Chrome On-Device AI Playground (V1.5.0)](#-chrome-on-device-ai-playground-v150)
  - [📑 Table of Contents](#-table-of-contents)
  - [✨ Overview](#-overview)
  - [📂 Project Structure & Modules](#-project-structure--modules)
    - [1. `liter.html` (WebGPU LiteRT-LM Engine)](#1-literhtml-webgpu-litert-lm-engine)
    - [2. `claude.html` (Multi-Provider Chat Interface)](#2-claudehtml-multi-provider-chat-interface)
    - [3. `vision_ulti.html` & `vision_code.html` (Vision & Code Analysis)](#3-vision_ultihtml--vision_codehtml-vision--code-analysis)
  - [🧠 In-Browser RAG & Local Knowledge Base](#-in-browser-rag--local-knowledge-base)
  - [🛠️ Architecture & Technology](#️-architecture--technology)
  - [🚀 Prerequisites & How to Run](#-prerequisites--how-to-run)
    - [Step 1: Hardware Requirements & Chrome On-Device AI (Gemini Nano) Activation](#step-1-hardware-requirements--activation-of-chrome-on-device-ai)
    - [Step 2: Run Local Server & Open Browser (Automated)](#step-2-run-local-server--open-browser-automated)
  - [⚙️ AI Mode Configuration Guide (Multi-Provider)](#️-ai-mode-configuration-guide-multi-provider)
  - [🐛 Troubleshooting](#-troubleshooting)
  - [🤝 Contribution](#-contribution)
  - [📄 License](#-license)

---

## ✨ Overview

This repository is a _playground_ to explore the limits of **Browser-based AI**. By leveraging cutting-edge web standards such as **WebGPU** and **Chrome Built-in AI (Prompt API)**, this repository demonstrates that Large Language Models (LLMs) can run directly on the user's hardware (local GPU/NPU) with extremely low latency.

**Key Advantages:**
* **Maximum Privacy (100% Offline):** All prompt and document processing is done locally. No data is sent to external servers.
* **Hardware-Accelerated Performance:** Uses WebGPU to utilize the device's graphics card directly.
* **Serverless Architecture:** Applications are built purely using HTML, CSS (Vanilla), and JavaScript ES Modules.

---

## 📂 Project Structure & Modules

Each `.html` file in this repository acts as a standalone *Single-Page Application (SPA)* demonstrating different technologies.

### 1. `liter.html` (WebGPU LiteRT-LM Engine)
This file is a *state-of-the-art* implementation of WebGPU inference using the latest framework from Google.
* **Technology:** `@litert-lm/core` (Primary) and `@mediapipe/tasks-genai` (Fallback).
* **Features:** 
  * Can load `.litertlm` formatted language models (e.g., `Gemma 4 E2B Instruct`) directly from local storage (File System) or download them from a HuggingFace URL.
  * Realtime progress bar when downloading model weights from the network.
  * Inference pipeline uses VRAM (GPU) directly for high-speed streaming responses.

### 2. `claude.html` (Multi-Provider Chat Interface)
A feature-rich chat interface, designed similarly to high-end professional AI applications (like Claude/ChatGPT).
* **Technology:** Google Chrome Built-in AI (`window.ai`), Ollama REST API, OpenAI-compatible API.
* **Features:**
  * **External LLM Server Support:** Through the built-in Settings menu, users can configure the app to connect to an external LLM server. We support:
    * **Ollama:** Connect directly to your local Ollama server (e.g., `http://localhost:11434`) to run Llama 3, Mistral, etc.
    * **OpenAI API / Custom Endpoint:** Enter a Base URL and API Key to use models from OpenAI (GPT-4o), Groq, Together AI, or local LM Studio servers.
  * **Multi-Provider Switcher:** Allows you to switch seamlessly between Chrome's built-in model (Gemini Nano) and the network/server models configured above.
  * **Persona/Prompt Library:** A built-in *system prompt* library to change the AI assistant's character (as a Programmer, Editor, Translator, etc.).
  * **Session Management:** Conversations are persistently stored in IndexedDB (`ClaudeChatDB`). Exporting conversations to PDF, DOCX, TXT, and JSON formats is available.

### 3. `vision_ulti.html` & `vision_code.html` (Vision & Code Analysis)
Focused on advanced text analysis and simple multimodal tasks.
* **Special Features:** *Quick Action* buttons for instant text manipulation (Translate, Summarize, Refine, Code Review).
* UI optimized for reading long lines of code and specifically formatted syntax.

---

## 🧠 In-Browser RAG & Local Knowledge Base

All application modules above (`liter.html`, `claude.html`, `vision_code.html`) are now equipped with a **Retrieval-Augmented Generation (RAG)** system that runs entirely on the client-side!

**How it works?**
1. **Document Parsing:** Users upload reference documents (supports `.pdf` via PDF.js, `.docx` via Mammoth.js, as well as `.txt` and `.md`).
2. **Chunking & Embedding:** Text is extracted and chunked using an *overlapping* technique. Then, using `Transformers.js` (model `Xenova/all-MiniLM-L6-v2`), the text is converted into vectors (embeddings).
3. **Local Storage:** Vectors and original text are permanently stored in the browser using IndexedDB.
4. **Vector Search:** When a user asks a question, the query is converted into a vector, then searched for matches (cosine similarity) against the documents in IndexedDB. Relevant context is injected directly into the AI prompt!

<details>
<summary>📸 <strong>View RAG / Knowledge Base Screenshots</strong></summary>
<br/>
<img width="100%" alt="RAG Screenshot 1" src="https://github.com/user-attachments/assets/8cbedf0e-d84a-49e0-8962-4741f7576bbc" />
<img width="100%" alt="RAG Screenshot 2" src="https://github.com/user-attachments/assets/3e2f8834-9e58-43c7-9bd1-94ddecce5e6b" />
<img width="100%" alt="RAG Screenshot 3" src="https://github.com/user-attachments/assets/31bf68d9-d1ad-4602-8018-afb003713a51" />
<img width="100%" alt="RAG Screenshot 4" src="https://github.com/user-attachments/assets/902be638-080d-43f3-970f-2ddcb68504cc" />
<img width="100%" alt="RAG Screenshot 5" src="https://github.com/user-attachments/assets/17d43877-8855-41d0-bb6a-2f887343814e" />
</details>

---

## 🛠️ Architecture & Technology

* **Frontend:** HTML5, CSS3 (Vanilla with custom variables for *Dynamic Theming*), Vanilla JavaScript (ESM).
* **Local Storage:** IndexedDB (stores session history and RAG Vector Database chunks).
* **Machine Learning / AI API:**
  * [Chrome Prompt API](https://github.com/WICG/prompt-api) (`window.ai`)
  * [LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM) (`@litert-lm/core`) via WebGPU
  * [Transformers.js](https://huggingface.co/docs/transformers.js/index) (for executing *embedding* models in the browser)
* **File Parsers:** `pdf.min.js`, `mammoth.browser.min.js`, `marked.js` (for markdown rendering), `highlight.js`.

---

## 🚀 Prerequisites & How to Run

Because this application interacts with experimental APIs (like reading local files, WebGPU, and high-memory access), it **cannot be run directly by double-clicking** (via the `file:///` protocol). You must serve it through a local HTTP Server.

### Step 1: Hardware Requirements & Chrome On-Device AI (Gemini Nano) Activation

**System Requirements (Hardware):**
* **Specific Apple Silicon (MacBook/Mac) Specs:**
  * Fully supports devices with Apple M1, M2, M3, or M4 chips (including Pro/Max/Ultra variants).
  * The *Unified Memory* architecture on Apple chips makes LLM and WebGPU inference run extremely smoothly *natively*. Devices with a base 8GB of unified memory are highly capable of running this built-in model smoothly.
  * It is recommended to use at least macOS Monterey (12.0) or newer to ensure WebGPU standards run optimally.
* **RAM (General/Windows):** Minimum 8GB (16GB or more is recommended for maximum performance and stability).
* **Storage:** Minimum 3GB of free space on your storage media (SSD highly recommended) to download language model weights.
* **GPU (Windows/Linux):** A graphics card that natively supports the **WebGPU** standard (e.g., Intel Iris Xe, modern AMD Radeon generations, or NVIDIA GTX 10 series and above).
* **Browser:** Google Chrome version 127 or newer (Using the latest **Chrome Dev** or **Canary** build is recommended).

**How to Activate On-Device AI (Prompt API):**
For Chrome's built-in AI features to run locally, you need to enable experimental *flags* and ensure the model is downloaded:

1. Open a new tab and access the URL: `chrome://flags`
2. Search for and enable these three options:
   * **Optimization Guide On Device Model:** Change its value to `Enabled BypassPerfRequirement`
   * **Prompt API for Gemini Nano:** Change its value to `Enabled`
   * **Enables WebGPU:** Change its value to `Enabled` (Usually enabled by default, but verify just in case)
3. Click the **Relaunch** button in the bottom right corner to restart your browser.
4. Once the browser reopens, open a new tab and access the URL: `chrome://components`
5. Scroll and find the component named **Optimization Guide On Device Model**.
6. Click the **Check for update** button. Wait for the download process to complete. This will download an AI model of ~1.5GB to 2GB in the background. Ensure the component version no longer shows `0.0.0.0`.

<img width="100%" alt="Chrome Flags Config" src="https://github.com/user-attachments/assets/b4b0d194-f1e4-41d8-869f-55ee50c4d67f" />

### Step 2: Run Local Server & Open Browser (Automated)
To make it easier for you, we have provided automation scripts that will:
1. Start a local HTTP server (using Python).
2. Automatically launch Google Chrome with the required command-line parameters (CLI flags).

**For Windows Users:**
Simply double-click the `start_windows.bat` file located in this repository's folder.

**For Mac Users:**
Simply double-click the `start_mac.command` file.
*(Note: If denied due to permission issues, open the terminal, navigate to this folder, and run `chmod +x start_mac.command` first).*

---

*(Optional) Manual Execution via Terminal:*
If you prefer running it manually without the scripts above, you can start the server with:
```bash
python3 -m http.server 8080
# Or using Node.js: npx http-server -p 8080
```
Then open `http://localhost:8080/` in a browser where the flags have been manually configured.

---

## ⚙️ AI Mode Configuration Guide (Multi-Provider)

This application (especially in the `claude.html` and `vision_ulti.html` interfaces) supports dynamic AI model switching. You can switch models via the **Settings** menu (Gear icon in the chat interface). Here is the configuration guide for each mode:

### 1. Chrome On-Device Mode (Gemini Nano)
This is the **default** mode of the application and runs 100% offline within your computer's RAM.
* **How to Use:** Works immediately if you have successfully followed *Step 1 (Chrome Flags Activation)* above.
* **Advantages:** Maximum privacy (data never leaves the browser), extremely low latency, and requires no internet.

### 2. Ollama Mode (Local Server)
Use this mode if you want to run open-source models (Llama 3, Mistral, etc.) through your local Ollama server.
* **Prerequisites:** You must install [Ollama](https://ollama.com/) and download a model (e.g., via terminal: `ollama run llama3`).
* **CORS Configuration (Very Important):** For the browser to be allowed to fetch data from the Ollama API, you MUST configure CORS.
  * **Windows:** Open *Environment Variables*, add a new *System Variable* named `OLLAMA_ORIGINS` with the value `*`. Restart the Ollama application in the system tray.
  * **Mac/Linux:** Quit Ollama, then run it from the terminal using the command: `OLLAMA_ORIGINS="*" ollama serve`
* **UI Application Settings:** Open Settings, select **Ollama**, ensure the **Base URL** contains `http://localhost:11434`, and enter the model name exactly as downloaded (e.g., `llama3`).

### 3. OpenAI API / Custom API Mode (LM Studio, Groq, etc.)
Use this mode to connect to premium Cloud API services (like OpenAI GPT-4o) or third-party local servers (like LM Studio) that provide an OpenAI-compatible endpoint.
* **For OpenAI / Cloud API:** Select **OpenAI** mode, enter your valid **API Key**, and fill in the model name (e.g., `gpt-4o`). The Base URL can be left empty (defaults to OpenAI).
* **For LM Studio (Local):** Open LM Studio and turn on the Local Server. In this web app, enter the **Base URL** from LM Studio (usually `http://localhost:1234/v1`), enter any arbitrary API Key (e.g., `lm-studio`), and enter the model name.

---

## 🐛 Troubleshooting

* **Simulation Model Active in `liter.html`:** This happens because the `@litert-lm/core` CDN package is still in "Early Preview" by Google and sometimes fails to download (depending on the CDN registry at that moment). Our script is equipped with multi-CDN fallbacks. Ensure a stable internet connection during initial initialization.
* **CORS Error on Transformers.js:** Ensure you are accessing the application via `localhost` or local IP (`127.0.0.1`), not by opening the file directly from File Explorer (`file://` protocol).
* **Gemini Nano not responding (`claude.html`):** Sometimes Chrome's local model takes time to download in the background. Try opening `chrome://components/`, find *Optimization Guide On Device Model*, and click the *Check for update* button.

---

## 🤝 Contribution

This project is very open to contributions! If you are interested in adding new API integrations, fixing bugs, or refining the UI, please submit a *Pull Request* or report issues via the *Issues* tab.

---

## 📄 License

This project is open-source under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify, and distribute this software.
