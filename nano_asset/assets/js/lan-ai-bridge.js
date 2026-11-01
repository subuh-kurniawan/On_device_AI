/**
 * lan-ai-bridge.js - Gemma / EduVis LAN AI Host & Client Bridge
 *
 * Mengizinkan browser di mesin server (MacBook) bertindak sebagai "AI Engine Host"
 * dan melayani permintaan inferensi AI dari perangkat klien (HP / tablet / laptop lain)
 * di jaringan Wi-Fi/LAN yang sama.
 *
 * Klien di HP TIDAK perlu memiliki model AI lokal atau Chrome Flags khusus.
 * Klien secara transparan "numpang" ke fitur on-device Chrome AI (Gemini Nano) di Mac.
 *
 * Mode Operasi:
 * 1. HOST MODE (Laptop/Komputer Mac):
 *    - Mendengarkan tugas inferensi dari Klien melalui WebSocket Relay.
 *    - Mengeksekusi prompt menggunakan window.ai (Gemini Nano On-Device) di browser host.
 *    - Men-stream delta token kembali ke klien secara real-time.
 *    - Menjaga tab tetap aktif (Screen Wake Lock API).
 *
 * 2. CLIENT MODE (HP / Tablet di Wi-Fi):
 *    - Secara otomatis menyediakan polyfill window.ai remote.
 *    - Aplikasi web (obrolan-claude.html) mendeteksi window.ai seolah-olah berjalan lokal.
 *    - promptStreaming() meneruskan query ke host Mac via WebSocket dan menerima token stream.
 *    - Menampilkan badge "AI Host LAN (Numpang Mac)" di antarmuka.
 */

(function (global) {
    'use strict';

    const BRIDGE_CONFIG = {
        relayWsPath: '/api/lan-ai-relay',
        relayHttpPath: '/api/lan-ai-http',
        statusPath: '/api/lan-ai-status',
        reconnectDelayMs: 2500,
        requestTimeoutMs: 120000
    };

    const bridgeState = {
        role: 'auto', // 'host' | 'client'
        isConnected: false,
        activeRequests: new Map(),
        servedRequestsCount: 0,
        ws: null,
        wakeLock: null,
        hostStatus: null
    };

    /**
     * Mendeteksi apakah peramban saat ini bertindak sebagai Host (Mac) atau Klien (HP)
     */
    function detectRole() {
        const params = new URLSearchParams(global.location.search);
        if (params.get('ai_role') === 'host') return 'host';
        if (params.get('ai_role') === 'client') return 'client';

        const host = global.location.hostname;
        const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';

        // Jika dibuka dari loopback (mesin server Mac tempat server dijalankan), bertindak sebagai Host
        if (isLoopback) return 'host';

        // Jika dibuka dari IP jaringan lain (10.x.x.x atau 192.168.x.x dari HP), bertindak sebagai Klien
        return 'client';
    }

    /**
     * Mencegah tab host tertidur saat melayani klien (Wake Lock API)
     */
    async function requestWakeLock() {
        if ('wakeLock' in navigator && !bridgeState.wakeLock) {
            try {
                bridgeState.wakeLock = await navigator.wakeLock.request('screen');
                bridgeState.wakeLock.addEventListener('release', () => {
                    bridgeState.wakeLock = null;
                });
            } catch (err) {
                // Abaikan jika ditolak atau browser tidak mendukung
            }
        }
    }

    // =========================================================================
    // MODUL HOST (Dijalankan di Google Chrome pada Mesin Mac Server)
    // =========================================================================

    /**
     * Eksekutor AI On-Device pada Browser Host Mac
     */
    async function executePromptOnHost(payload, onChunk) {
        const { prompt, systemPrompt, options = {} } = payload;

        // Ekstrak teks prompt jika dikirim sebagai array multimodal
        let rawPromptText = prompt;
        let imageBlob = null;

        if (Array.isArray(prompt)) {
            for (const item of prompt) {
                if (item.content && Array.isArray(item.content)) {
                    for (const part of item.content) {
                        if (part.type === 'text') rawPromptText = part.value || part.text || rawPromptText;
                        if (part.type === 'image' && part.value) {
                            imageBlob = part.value; // DataURL atau Blob
                        }
                    }
                }
            }
        }

        // TIER 1: Chrome Built-in AI (window.ai.languageModel / window.ai.assistant)
        const aiApi = global.ai?.languageModel || global.ai?.assistant || global.LanguageModel;
        if (aiApi && typeof aiApi.create === 'function') {
            const createParams = {
                outputLanguage: 'id',
                temperature: options.temperature || 0.2,
                topK: options.topK || 3,
                initialPrompts: [{
                    role: 'system',
                    content: systemPrompt || 'Anda adalah asisten AI cerdas berbahasa Indonesia.'
                }]
            };

            // Tambahkan dukungan gambar jika API host mendukung
            if (imageBlob) {
                createParams.expectedInputs = [{ type: 'text' }, { type: 'image' }];
            }

            let session = null;
            try {
                session = await aiApi.create(createParams);
            } catch (createErr) {
                // Fallback dengan opsi lebih sederhana jika initialPrompts gagal
                session = await aiApi.create({
                    systemPrompt: systemPrompt || 'Anda adalah asisten AI cerdas berbahasa Indonesia.'
                });
            }

            try {
                if (typeof session.promptStreaming === 'function') {
                    const stream = session.promptStreaming(rawPromptText);
                    let previous = '';
                    for await (const chunk of stream) {
                        const delta = chunk.startsWith(previous) ? chunk.slice(previous.length) : chunk;
                        previous = chunk;
                        if (delta) onChunk(delta);
                    }
                    return previous;
                } else {
                    const response = await session.prompt(rawPromptText);
                    onChunk(response);
                    return response;
                }
            } finally {
                session?.destroy?.();
            }
        }

        // TIER 2: Fallback ke Endpoint Lokal Host (Ollama / LiteRT-LM / OpenAI-compatible)
        const baseUrl = options.apiBaseUrl || 'http://localhost:11434';
        const model = options.model || 'llama3';

        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: rawPromptText }
                ],
                stream: true
            })
        });

        if (!res.ok) {
            throw new Error(`AI Host lokal merespons HTTP ${res.status}. Pastikan Chrome AI atau Ollama aktif di Mac.`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const textChunk = decoder.decode(value, { stream: true });
            const lines = textChunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    const delta = parsed.message?.content || parsed.response || '';
                    if (delta) {
                        fullText += delta;
                        onChunk(delta);
                    }
                } catch (e) {}
            }
        }

        return fullText;
    }

    /**
     * Memulai koneksi Bridge di browser Server Host Mac
     */
    function startHostMode() {
        requestWakeLock();
        renderHostBadge();

        const protocol = global.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${global.location.host}${BRIDGE_CONFIG.relayWsPath}?role=host`;

        function connectWs() {
            try {
                const ws = new WebSocket(wsUrl);
                bridgeState.ws = ws;

                ws.onopen = () => {
                    bridgeState.isConnected = true;
                    updateHostBadge('🟢 Melayani Klien LAN (Siap)');
                };

                ws.onmessage = async (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'prompt_request') {
                            const { requestId, payload } = data;
                            bridgeState.servedRequestsCount++;
                            updateHostBadge(`⚡ Memproses permintaan dari ${payload.clientIp || 'HP'}...`);

                            try {
                                await executePromptOnHost(payload, (chunk) => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.send(JSON.stringify({
                                            type: 'stream_chunk',
                                            requestId,
                                            chunk
                                        }));
                                    }
                                });

                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({
                                        type: 'stream_done',
                                        requestId
                                    }));
                                }
                            } catch (err) {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({
                                        type: 'stream_error',
                                        requestId,
                                        error: err.message || String(err)
                                    }));
                                }
                            } finally {
                                updateHostBadge(`🟢 Melayani Klien LAN (Total: ${bridgeState.servedRequestsCount})`);
                            }
                        }
                    } catch (e) {
                        console.error('[LanBridge Host] Error handling message:', e);
                    }
                };

                ws.onclose = () => {
                    bridgeState.isConnected = false;
                    updateHostBadge('🟠 Menghubungkan ulang ke Server...');
                    setTimeout(connectWs, BRIDGE_CONFIG.reconnectDelayMs);
                };

                ws.onerror = () => {
                    ws.close();
                };
            } catch (err) {
                updateHostBadge('⚠️ Gagal terhubung ke Relay Server');
            }
        }

        connectWs();
    }

    // =========================================================================
    // MODUL CLIENT (Dijalankan di HP / Tablet / Laptop Klien di Wi-Fi)
    // =========================================================================

    /**
     * Mengirim prompt dari klien ke browser Host Mac
     */
    function sendPromptToHost(prompt, options = {}, onChunk = () => {}, onDone = () => {}, onError = () => {}) {
        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const protocol = global.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${global.location.host}${BRIDGE_CONFIG.relayWsPath}?role=client&id=${requestId}`;

        const payload = {
            prompt,
            systemPrompt: options.systemPrompt || (global.aiSettings?.systemPrompt) || '',
            options,
            clientIp: global.location.hostname
        };

        // Fallback HTTP Relay jika WebSocket diblokir
        function fallbackHttp() {
            fetch(BRIDGE_CONFIG.relayHttpPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, payload })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) onError(new Error(data.error));
                else {
                    if (data.text) onChunk(data.text);
                    onDone(data.text || '');
                }
            })
            .catch(err => onError(err));
        }

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                ws.send(JSON.stringify({
                    type: 'prompt_request',
                    requestId,
                    payload
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'stream_chunk' && msg.chunk) {
                        onChunk(msg.chunk);
                    } else if (msg.type === 'stream_done') {
                        onDone();
                        ws.close();
                    } else if (msg.type === 'stream_error') {
                        onError(new Error(msg.error || 'Terjadi kesalahan pada AI Host Mac.'));
                        ws.close();
                    }
                } catch (e) {}
            };

            ws.onerror = () => {
                fallbackHttp();
            };
        } catch (e) {
            fallbackHttp();
        }
    }

    /**
     * Membuat AsyncStream Iterable untuk dikonsumsi oleh obrolan-claude.html (chatSession.promptStreaming)
     */
    function createRemoteAsyncStream(promptPayload, options = {}) {
        const queue = [];
        let resolveNext = null;
        let isDone = false;
        let streamError = null;

        function pushChunk(chunk) {
            queue.push(chunk);
            if (resolveNext) {
                const r = resolveNext;
                resolveNext = null;
                r();
            }
        }

        function finish() {
            isDone = true;
            if (resolveNext) {
                const r = resolveNext;
                resolveNext = null;
                r();
            }
        }

        function fail(err) {
            streamError = err;
            isDone = true;
            if (resolveNext) {
                const r = resolveNext;
                resolveNext = null;
                r();
            }
        }

        sendPromptToHost(
            promptPayload,
            options,
            (chunk) => pushChunk(chunk),
            () => finish(),
            (err) => fail(err)
        );

        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        while (queue.length === 0 && !isDone) {
                            await new Promise(res => { resolveNext = res; });
                        }
                        if (queue.length > 0) {
                            return { value: queue.shift(), done: false };
                        }
                        if (streamError) {
                            throw streamError;
                        }
                        return { value: undefined, done: true };
                    }
                };
            }
        };
    }

    /**
     * Polyfill Remote Sesi yang sesuai dengan antarmuka Chrome AI AILanguageModel
     */
    function createRemoteLanSession(options = {}) {
        return {
            isRemoteLan: true,
            maxTokens: 4096,
            tokensSoFar: 0,
            tokensLeft: 4096,
            addContext: async () => {},
            destroy: () => {},
            prompt: async (promptPayload) => {
                return new Promise((resolve, reject) => {
                    let fullText = '';
                    sendPromptToHost(
                        promptPayload,
                        options,
                        (chunk) => { fullText += chunk; },
                        (doneText) => { resolve(doneText || fullText); },
                        (err) => { reject(err); }
                    );
                });
            },
            promptStreaming: function (promptPayload) {
                return createRemoteAsyncStream(promptPayload, options);
            }
        };
    }

    /**
     * Memasang Polyfill window.ai di Klien (HP) agar obrolan-claude.html langsung mendeteksinya
     */
    function installClientPolyfill() {
        // Hanya pasang polyfill jika tidak ada native window.ai ATAU terdeteksi sebagai klien
        const shouldPolyfill = !global.ai?.languageModel?.capabilities || bridgeState.role === 'client';

        if (shouldPolyfill) {
            const remoteAiApi = {
                capabilities: async () => ({
                    available: 'readily',
                    defaultTemperature: 0.2,
                    defaultTopK: 3,
                    maxTopK: 8
                }),
                availability: async () => 'readily',
                create: async (sessionOptions = {}) => {
                    return createRemoteLanSession(sessionOptions);
                }
            };

            global.ai = global.ai || {};
            global.ai.languageModel = remoteAiApi;
            global.ai.assistant = remoteAiApi;
            global.LanguageModel = remoteAiApi;
            console.log('🌐 [LanAIBridge] Remote Chrome AI Proxy aktif: Klien numpang On-Device Host Mac.');
        }
    }

    function startClientMode() {
        installClientPolyfill();
        renderClientBadge();

        // Update indikator UI obrolan-claude.html jika sudah siap
        setTimeout(() => {
            const badge = document.getElementById('model-badge');
            if (badge) {
                badge.innerText = 'AI Host LAN (Numpang Mac)';
                badge.className = 'text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest';
            }
            const status = document.getElementById('status');
            if (status) {
                status.className = 'w-2 h-2 rounded-full bg-sky-400 animate-pulse';
            }
        }, 300);
    }

    // =========================================================================
    // UI BADGE / INDIKATOR STATUS
    // =========================================================================

    function renderHostBadge() {
        if (document.getElementById('lan-ai-host-badge')) return;
        const badge = document.createElement('div');
        badge.id = 'lan-ai-host-badge';
        badge.className = 'fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/85 px-3.5 py-1.5 text-xs text-emerald-300 shadow-xl backdrop-blur-md transition-all select-none font-medium';
        badge.innerHTML = `
            <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span id="lan-ai-host-text">🟢 AI Host Mac Aktif (Melayani Klien)</span>
        `;
        document.body.appendChild(badge);
    }

    function updateHostBadge(text) {
        const el = document.getElementById('lan-ai-host-text');
        if (el) el.textContent = text;
    }

    function renderClientBadge() {
        if (document.getElementById('lan-ai-client-badge')) return;
        const badge = document.createElement('div');
        badge.id = 'lan-ai-client-badge';
        badge.className = 'fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/85 px-3.5 py-1.5 text-xs text-sky-300 shadow-xl backdrop-blur-md select-none font-medium';
        badge.innerHTML = `
            <span>🌐</span>
            <span id="lan-ai-client-text">Terhubung ke Host Mac (${global.location.hostname})</span>
        `;
        document.body.appendChild(badge);
    }

    // =========================================================================
    // INISIALISASI
    // =========================================================================

    function init() {
        const role = detectRole();
        bridgeState.role = role;

        if (role === 'host') {
            startHostMode();
        } else {
            startClientMode();
        }
    }

    // Pasang polyfill seawal mungkin sebelum script lain memanggil initChat()
    if (detectRole() === 'client') {
        installClientPolyfill();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    // Ekspor API Bridge
    global.LanAIBridge = {
        detectRole,
        sendPromptToHost,
        executePromptOnHost,
        createRemoteLanSession,
        getState: () => ({ ...bridgeState })
    };

})(typeof window !== 'undefined' ? window : globalThis);
