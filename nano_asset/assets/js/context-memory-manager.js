/**
 * context-memory-manager.js - Gemma 4 Adaptive Context & Long-Term Memory Manager
 *
 * Mengelola sistem memori cerdas untuk model AI lokal (LiteRT-LM & Ollama):
 * 1. Short-Term Memory (Summary Buffer Memory):
 *    - Memadatkan riwayat obrolan lama ketika melebihi ambang batas token / giliran.
 *    - Kompatibel penuh dengan Apple WKWebView (macOS) dan browser klien.
 *    - Menggunakan multi-tier summarization: Local Endpoint -> window.ai -> Heuristic condensation.
 * 2. Long-Term Memory (Knowledge Base Vector Archival):
 *    - Mengarsipkan ringkasan percakapan dan modul ajar penting ke dalam koleksi vektor
 *      multilingual-e5-small (IndexedDB kb_chunks & kb_files) untuk retrieval lintas sesi.
 */
(function (global) {
    'use strict';

    // Konfigurasi ambang batas default
    const DEFAULT_CONFIG = {
        thresholdTurns: 12,       // 12 pesan (6 pasang user+assistant) mulai dipadatkan
        keepRecentTurns: 6,       // 6 pesan terakhir dipertahankan sebagai raw context
        maxSummaryTokens: 150,    // Batas panjang ringkasan token
        summaryTimeoutMs: 3500    // Timeout background summarizer agar UI tidak terblokir
    };

    /**
     * Ekstraktor heuristik deterministik (Tier 3 Fallback)
     * Bekerja instan (0ms) di Apple WKWebView maupun browser tanpa dependensi jaringan.
     */
    function extractHeuristicSummary(messages, previousSummary = '') {
        if (typeof previousSummary !== 'string') {
            previousSummary = (previousSummary && typeof previousSummary.existingSummary === 'string')
                ? previousSummary.existingSummary
                : '';
        }
        if (!Array.isArray(messages) || messages.length === 0) {
            return previousSummary || '';
        }

        const userPrompts = [];
        const assistantPoints = [];

        for (const msg of messages) {
            const role = (msg.role || '').toLowerCase();
            const text = String(msg.text || msg.content || '').trim();
            if (!text) continue;

            if (role === 'user') {
                // Ambil kalimat pertama dari prompt pengguna (maks 100 karakter)
                const firstSentence = text.split(/[.\n?!]/)[0].trim();
                if (firstSentence && !userPrompts.includes(firstSentence)) {
                    userPrompts.push(firstSentence.slice(0, 100));
                }
            } else if (role === 'assistant') {
                // Cari poin kesimpulan atau inti pembahasan
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                for (const line of lines) {
                    if (/^[-*•\d.]+\s+/.test(line) || /kesimpulan|intinya|langkah/i.test(line)) {
                        const cleanLine = line.replace(/^[-*•\d.]+\s+/, '').slice(0, 80);
                        if (cleanLine && assistantPoints.length < 3) {
                            assistantPoints.push(cleanLine);
                        }
                    }
                }
            }
        }

        const topics = userPrompts.slice(0, 3).join('; ');
        const highlights = assistantPoints.length > 0 ? ` Catatan utama: ${assistantPoints.join(', ')}.` : '';

        let summaryText = `Topik sebelumnya mencakup: ${topics}.${highlights}`;
        if (previousSummary) {
            summaryText = `${previousSummary.replace(/\.*$/, '')}; dilanjutkan dengan pembahasan: ${topics}.${highlights}`;
        }

        return summaryText.slice(0, 400);
    }

    /**
     * Meringkas pesan yang tergeser keluar (Multi-Tier Engine)
     * Kompatibel dengan Apple WKWebView (native fetch ke localhost LiteRT-LM/Ollama).
     */
    async function summarizeMessages(evictedMessages, previousSummary = '', options = {}) {
        if (typeof previousSummary === 'object' && previousSummary !== null) {
            options = previousSummary;
            previousSummary = options.existingSummary || '';
        }
        previousSummary = typeof previousSummary === 'string' ? previousSummary : '';

        if (!Array.isArray(evictedMessages) || evictedMessages.length === 0) {
            return previousSummary || '';
        }

        const timeoutMs = options.summaryTimeoutMs || DEFAULT_CONFIG.summaryTimeoutMs;
        const transcript = evictedMessages
            .map(m => `${(m.role || 'user').toUpperCase()}: ${String(m.text || m.content || '').slice(0, 200)}`)
            .join('\n');

        // TIER 1: Panggilan lokal ke API LiteRT-LM / OpenAI-compatible / Ollama
        // (Berjalan 100% mulus di Apple WKWebView karena localhost server aktif)
        if (options.apiBaseUrl && typeof fetch === 'function') {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeoutMs);

                const prompt = `Ringkas pokok bahasan berikut dalam 2-3 kalimat padat (fokus pada topik utama dan kesepakatan penting):\n\n${previousSummary ? `[Ringkasan Sebelumnya: ${previousSummary}]\n` : ''}${transcript}`;

                const endpoint = `${options.apiBaseUrl.replace(/\/+$/, '')}/v1/chat/completions`;
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(options.apiKey ? { 'Authorization': `Bearer ${options.apiKey}` } : {})
                    },
                    body: JSON.stringify({
                        model: options.model || 'gemma',
                        messages: [
                            { role: 'system', content: 'Anda adalah asisten peringkas konteks. Berikan HANYA ringkasan 2-3 kalimat tanpa pembuka atau penutup.' },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: options.maxSummaryTokens || DEFAULT_CONFIG.maxSummaryTokens,
                        temperature: 0.1,
                        stream: false
                    }),
                    signal: controller.signal
                });

                clearTimeout(timer);

                if (res.ok) {
                    const data = await res.json();
                    const text = data.choices?.[0]?.message?.content?.trim();
                    if (text && text.length > 10) {
                        return text;
                    }
                }
            } catch (err) {
                // Abaikan error jaringan/timeout dan beralih ke Tier berikutnya
            }
        }

        // TIER 2: Chrome Built-in AI (window.ai.summarizer jika tersedia)
        if (typeof window !== 'undefined' && window.ai && typeof window.ai.summarizer?.create === 'function') {
            try {
                const summarizer = await window.ai.summarizer.create({
                    sharedContext: 'Ringkasan konteks obrolan sebelumnya',
                    type: 'tl;dr',
                    length: 'short'
                });
                const result = await summarizer.summarize(transcript);
                summarizer.destroy?.();
                if (result && result.trim()) {
                    return result.trim();
                }
            } catch (e) {
                // Beralih ke Tier 3
            }
        }

        // TIER 3: Fallback Ekstraktif Deterministik (0ms, Zero Fail)
        return extractHeuristicSummary(evictedMessages, previousSummary);
    }

    /**
     * Memeriksa dan memadatkan riwayat obrolan (Summary Buffer Memory)
     */
    async function compactHistory(messages, options = {}) {
        const threshold = options.thresholdTurns || DEFAULT_CONFIG.thresholdTurns;
        const keepRecent = options.keepRecentTurns || DEFAULT_CONFIG.keepRecentTurns;
        const currentSummary = options.existingSummary || '';

        if (!Array.isArray(messages) || messages.length <= threshold) {
            return {
                compacted: false,
                summary: currentSummary,
                messages: messages,
                evictedCount: 0
            };
        }

        const evictCount = messages.length - keepRecent;
        const evicted = messages.slice(0, evictCount);
        const recent = messages.slice(evictCount);

        const newSummary = await summarizeMessages(evicted, currentSummary, options);

        return {
            compacted: true,
            summary: newSummary,
            messages: recent,
            evictedCount: evicted.length
        };
    }

    /**
     * Menyusun format array pesan untuk LLM dengan menyisipkan summary buffer
     */
    function buildPromptContext(recentMessages, sessionSummary = '', systemPrompt = '') {
        const result = [];

        if (systemPrompt && systemPrompt.trim()) {
            result.push({ role: 'system', content: systemPrompt.trim() });
        }

        if (sessionSummary && sessionSummary.trim()) {
            result.push({
                role: 'system',
                content: `[Konteks Pembahasan Sebelumnya]: ${sessionSummary.trim()}`
            });
        }

        if (Array.isArray(recentMessages)) {
            for (const msg of recentMessages) {
                const role = msg.role === 'user' ? 'user' : 'assistant';
                const content = String(msg.text || msg.content || '');
                if (content.trim()) {
                    result.push({ role, content });
                }
            }
        }

        return result;
    }

    /**
     * TAHAP 2: Pengarsipan Otomatis ke Koleksi Vektor Knowledge Base (IndexedDB)
     * Menggunakan model embedding lokal multilingual-e5-small untuk ingatan jangka panjang.
     */
    async function archiveToKnowledgeBase(db, options = {}) {
        if (!db) {
            throw new Error('Database IndexedDB tidak tersedia.');
        }

        const {
            title = 'Arsip Sesi Pembahasan',
            content = '',
            category = 'memory',
            tags = ['memori', 'arsip'],
            extractEmbeddingFn = null,
            chunkTextFn = null
        } = options;

        if (!content || !content.trim()) {
            throw new Error('Konten memori tidak boleh kosong.');
        }

        const fileId = 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const fileName = title.trim();

        // 1. Simpan metadata dokumen di kb_files
        await new Promise((resolve, reject) => {
            const tx = db.transaction('kb_files', 'readwrite');
            const store = tx.objectStore('kb_files');
            const fileRecord = {
                id: fileId,
                name: fileName,
                size: content.length,
                type: 'session_memory',
                category: category,
                tags: tags,
                timestamp: Date.now(),
                chunkCount: 0
            };
            const req = store.add(fileRecord);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });

        // 2. Pemecahan Chunk (Semantic Chunker default jika fungsi tidak di-pass)
        let chunks = [];
        if (typeof chunkTextFn === 'function') {
            chunks = chunkTextFn(content, 500, 100);
        } else {
            // Default paragraph/sentence chunker
            const rawParts = content.split(/\n\n+/).filter(Boolean);
            if (rawParts.length > 0) {
                chunks = rawParts;
            } else {
                chunks = [content.slice(0, 800)];
            }
        }

        let savedCount = 0;

        // 3. Ekstraksi Vektor dan Penyimpanan di kb_chunks
        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];
            let embedding = null;

            if (typeof extractEmbeddingFn === 'function') {
                try {
                    embedding = await extractEmbeddingFn(chunkText, false);
                } catch (embErr) {
                    console.warn('[GemmaMemory] Gagal mengekstrak vektor chunk:', embErr);
                }
            }

            await new Promise((resolve, reject) => {
                const tx = db.transaction('kb_chunks', 'readwrite');
                const store = tx.objectStore('kb_chunks');
                const chunkRecord = {
                    id: `chunk_${fileId}_${i}`,
                    fileId: fileId,
                    text: chunkText,
                    embedding: embedding || []
                };
                const req = store.add(chunkRecord);
                req.onsuccess = () => {
                    savedCount++;
                    resolve();
                };
                req.onerror = (e) => reject(e.target.error);
            });
        }

        // 4. Update total chunkCount di kb_files
        await new Promise((resolve) => {
            const tx = db.transaction('kb_files', 'readwrite');
            const store = tx.objectStore('kb_files');
            const getReq = store.get(fileId);
            getReq.onsuccess = (e) => {
                const data = e.target.result;
                if (data) {
                    data.chunkCount = savedCount;
                    store.put(data);
                }
                resolve();
            };
            getReq.onerror = () => resolve();
        });

        return {
            success: true,
            fileId: fileId,
            title: fileName,
            chunkCount: savedCount
        };
    }

    /**
     * Konversi riwayat obrolan ke format dokumen Markdown siap arsip
     */
    function exportConversationAsMemoryDocument(messages, title = '') {
        const dateStr = new Date().toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        let doc = `# Dokumen Memori: ${title || 'Ringkasan Sesi Pembahasan'}\n`;
        doc += `*Diarsipkan secara lokal pada: ${dateStr}*\n\n`;
        doc += `## Transkrip Inti Pembahasan\n\n`;

        for (const msg of (messages || [])) {
            const role = (msg.role || '').toLowerCase();
            const text = String(msg.text || msg.content || '').trim();
            if (!text) continue;

            if (role === 'user') {
                doc += `### 👤 Guru / Pengguna:\n${text}\n\n`;
            } else if (role === 'assistant') {
                doc += `### 🤖 Asisten EduVis AI:\n${text}\n\n---\n\n`;
            }
        }

        return doc;
    }

    /**
     * Estimasi token teks (Bahasa Indonesia & multilingual: ~3.5 karakter per token)
     */
    function estimateTokens(str) {
        if (!str) return 0;
        const text = String(str);
        return Math.max(1, Math.ceil(text.length / 3.5));
    }

    /**
     * Menghitung rincian penggunaan token pada konteks obrolan
     */
    function getContextBreakdown(historyMessages, options = {}) {
        const maxTokens = Number(options.maxTokens) || 4096;
        const systemPrompt = String(options.systemPrompt || '');
        const sessionSummary = String(options.sessionSummary || '');

        const systemTokens = estimateTokens(systemPrompt);
        const summaryTokens = sessionSummary ? estimateTokens(`[Konteks Pembahasan Sebelumnya]: ${sessionSummary}`) : 0;

        let historyTokens = 0;
        const allMessages = Array.isArray(historyMessages) ? historyMessages : [];
        // Hanya hitung jendela riwayat yang benar-benar dikirim ke model (getChatHistoryFromDB(limit))
        const windowSize = Number(options.historyWindow) || 0;
        const messages = windowSize > 0 ? allMessages.slice(-windowSize) : allMessages;
        for (const msg of messages) {
            const content = typeof msg.content === 'string'
                ? msg.content
                : (typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.content || msg.text || ''));
            historyTokens += estimateTokens(content);
        }

        const totalUsed = systemTokens + summaryTokens + historyTokens;
        const remainingTokens = Math.max(0, maxTokens - totalUsed);
        const percentage = Math.min(100, Math.round((totalUsed / maxTokens) * 100));

        let state = 'green';
        if (percentage >= 75) {
            state = 'orange';
        } else if (percentage >= 50) {
            state = 'yellow';
        }

        return {
            maxTokens,
            totalUsed,
            remainingTokens,
            percentage,
            state,
            systemTokens,
            summaryTokens,
            historyTokens,
            messageCount: messages.length,
            totalMessageCount: allMessages.length,
            hasSummary: Boolean(sessionSummary.trim())
        };
    }

    /**
     * Merender status visual Memory Gauge Pill pada elemen DOM
     */
    function renderContextGauge(el, historyMessages, options = {}) {
        if (!el) return null;
        const breakdown = getContextBreakdown(historyMessages, options);

        // Hapus kelas warna / status sebelumnya
        el.classList.remove(
            'hidden',
            'bg-slate-800', 'text-slate-300', 'border-white/10',
            'bg-emerald-500/15', 'text-emerald-400', 'border-emerald-500/30',
            'bg-amber-500/15', 'text-amber-400', 'border-amber-500/30',
            'bg-orange-500/20', 'text-orange-400', 'border-orange-500/40', 'animate-pulse'
        );

        let icon = '🟢';
        let stateClasses = ['bg-emerald-500/15', 'text-emerald-400', 'border-emerald-500/30'];

        if (breakdown.state === 'orange') {
            icon = '🟠';
            stateClasses = ['bg-orange-500/20', 'text-orange-400', 'border-orange-500/40'];
            if (breakdown.percentage >= 85) stateClasses.push('animate-pulse');
        } else if (breakdown.state === 'yellow') {
            icon = '🟡';
            stateClasses = ['bg-amber-500/15', 'text-amber-400', 'border-amber-500/30'];
        }

        el.classList.add(...stateClasses);

        // Konten teks badge
        el.innerHTML = `${icon} Memori: ${breakdown.totalUsed.toLocaleString('id-ID')} / ${breakdown.maxTokens.toLocaleString('id-ID')} (${breakdown.percentage}%)`;

        // Tooltip informatif komprehensif
        const tooltip = [
            `Kapasitas Konteks KV-Cache: ${breakdown.percentage}% terpakai (${breakdown.totalUsed.toLocaleString('id-ID')} / ${breakdown.maxTokens.toLocaleString('id-ID')} token)`,
            `• System Prompt: ~${breakdown.systemTokens.toLocaleString('id-ID')} token`,
            `• Ringkasan Berjalan: ~${breakdown.summaryTokens.toLocaleString('id-ID')} token`,
            `• Riwayat Obrolan: ~${breakdown.historyTokens.toLocaleString('id-ID')} token (${breakdown.messageCount} pesan)`,
            `• Sisa Anggaran Output AI: ~${breakdown.remainingTokens.toLocaleString('id-ID')} token`,
            breakdown.state === 'orange' ? `⚠️ Peringatan: Auto-Compact Summary Buffer aktif merampingkan riwayat saat >12 pesan` : ''
        ].filter(Boolean).join('\n');

        el.setAttribute('title', tooltip);

        // Simpan state terakhir & aktifkan Context Inspector (klik / Enter / Spasi)
        el.__gemmaGauge = { breakdown, options };
        bindContextInspector(el);
        if (inspectorState.anchor === el) renderInspectorContent();

        return breakdown;
    }

    // =====================================================================
    // CONTEXT INSPECTOR POPOVER (mandiri: CSS sendiri, tanpa Tailwind/CDN)
    // Bekerja identik di Apple WKWebView dan browser klien.
    // =====================================================================
    const INSPECTOR_ID = 'gm-context-inspector';
    const inspectorState = { anchor: null, busy: false };

    function fmt(n) {
        return Number(n || 0).toLocaleString('id-ID');
    }

    function ensureInspectorStyles() {
        if (typeof document === 'undefined' || document.getElementById(INSPECTOR_ID + '-style')) return;
        const style = document.createElement('style');
        style.id = INSPECTOR_ID + '-style';
        style.textContent = `
#${INSPECTOR_ID}{position:fixed;z-index:10050;width:min(360px,calc(100vw - 24px));padding:16px;border-radius:18px;
 border:1px solid rgba(255,255,255,.12);background:rgba(17,20,30,.92);color:#e5e7eb;
 -webkit-backdrop-filter:blur(18px) saturate(140%);backdrop-filter:blur(18px) saturate(140%);
 box-shadow:0 18px 50px rgba(0,0,0,.45);font:400 12.5px/1.45 -apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;
 opacity:0;transform:translateY(-4px) scale(.98);transition:opacity .14s ease,transform .14s ease}
#${INSPECTOR_ID}.gm-open{opacity:1;transform:none}
#${INSPECTOR_ID}[hidden]{display:none}
#${INSPECTOR_ID} .gm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
#${INSPECTOR_ID} .gm-title{font-weight:600;font-size:13.5px;color:#f8fafc}
#${INSPECTOR_ID} .gm-sub{font-size:11.5px;color:#94a3b8;margin-top:2px}
#${INSPECTOR_ID} .gm-pct{font:600 22px/1 ui-monospace,"SF Mono","Fira Code",monospace;letter-spacing:-.02em}
#${INSPECTOR_ID} .gm-close{border:0;background:rgba(255,255,255,.08);color:#cbd5e1;width:26px;height:26px;border-radius:999px;cursor:pointer;font-size:15px;line-height:1;flex:0 0 auto}
#${INSPECTOR_ID} .gm-close:hover{background:rgba(255,255,255,.16)}
#${INSPECTOR_ID} .gm-bar{display:flex;height:10px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.07);margin:4px 0 12px}
#${INSPECTOR_ID} .gm-seg{height:100%;transition:width .25s ease}
#${INSPECTOR_ID} .gm-seg+.gm-seg{box-shadow:inset 1px 0 0 rgba(0,0,0,.35)}
#${INSPECTOR_ID} .gm-legend{display:grid;gap:6px;margin:0;padding:0;list-style:none}
#${INSPECTOR_ID} .gm-row{display:grid;grid-template-columns:10px 1fr auto auto;align-items:center;gap:8px}
#${INSPECTOR_ID} .gm-dot{width:10px;height:10px;border-radius:3px}
#${INSPECTOR_ID} .gm-val{font-family:ui-monospace,"SF Mono","Fira Code",monospace;color:#f1f5f9}
#${INSPECTOR_ID} .gm-share{font-family:ui-monospace,"SF Mono","Fira Code",monospace;color:#64748b;min-width:34px;text-align:right}
#${INSPECTOR_ID} .gm-note{margin-top:12px;padding:9px 10px;border-radius:12px;font-size:11.5px;background:rgba(255,255,255,.05);color:#cbd5e1}
#${INSPECTOR_ID} .gm-note.gm-warn{background:rgba(249,115,22,.12);color:#fdba74}
#${INSPECTOR_ID} .gm-summary{margin-top:10px}
#${INSPECTOR_ID} .gm-summary summary{cursor:pointer;color:#a5b4fc;font-size:11.5px;list-style:none}
#${INSPECTOR_ID} .gm-summary summary::-webkit-details-marker{display:none}
#${INSPECTOR_ID} .gm-summary p{margin:6px 0 0;max-height:110px;overflow:auto;white-space:pre-wrap;color:#cbd5e1;font-size:11.5px}
#${INSPECTOR_ID} .gm-actions{display:flex;gap:8px;margin-top:14px}
#${INSPECTOR_ID} .gm-btn{flex:1;min-height:34px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);
 color:#e2e8f0;font-family:inherit;font-weight:600;font-size:11.5px;line-height:1;cursor:pointer;transition:background .15s}
#${INSPECTOR_ID} .gm-btn:hover:not(:disabled){background:rgba(255,255,255,.13)}
#${INSPECTOR_ID} .gm-btn.gm-primary{background:rgba(99,102,241,.22);border-color:rgba(129,140,248,.4);color:#e0e7ff}
#${INSPECTOR_ID} .gm-btn.gm-primary:hover:not(:disabled){background:rgba(99,102,241,.34)}
#${INSPECTOR_ID} .gm-btn:disabled{opacity:.45;cursor:not-allowed}
#${INSPECTOR_ID}.gm-light{background:rgba(255,255,255,.95);color:#1e293b;border-color:rgba(15,23,42,.1);box-shadow:0 18px 50px rgba(15,23,42,.18)}
#${INSPECTOR_ID}.gm-light .gm-title,#${INSPECTOR_ID}.gm-light .gm-val{color:#0f172a}
#${INSPECTOR_ID}.gm-light .gm-bar,#${INSPECTOR_ID}.gm-light .gm-note,#${INSPECTOR_ID}.gm-light .gm-btn,#${INSPECTOR_ID}.gm-light .gm-close{background:rgba(15,23,42,.06);color:#334155}
#${INSPECTOR_ID}.gm-light .gm-btn{border-color:rgba(15,23,42,.12)}
#${INSPECTOR_ID}.gm-light .gm-summary p{color:#334155}
#${INSPECTOR_ID}.gm-light .gm-note.gm-warn{background:rgba(249,115,22,.12);color:#c2410c}
@media (max-width:640px){#${INSPECTOR_ID}{left:12px!important;right:12px;top:auto!important;bottom:max(12px,env(safe-area-inset-bottom));width:auto}}
@media (prefers-reduced-motion:reduce){#${INSPECTOR_ID},#${INSPECTOR_ID} .gm-seg{transition:none}}
[data-gm-gauge]{cursor:pointer}
[data-gm-gauge]:focus-visible{outline:2px solid #818cf8;outline-offset:2px}`;
        document.head.appendChild(style);
    }

    function bindContextInspector(el) {
        if (typeof document === 'undefined' || !el || typeof el.addEventListener !== 'function' || el.dataset?.gmGauge) return;
        el.dataset.gmGauge = '1';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-haspopup', 'dialog');
        el.setAttribute('aria-expanded', 'false');
        el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            toggleContextInspector(el);
        });
        el.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                toggleContextInspector(el);
            }
        });
    }

    function getInspector() {
        let pop = document.getElementById(INSPECTOR_ID);
        if (pop) return pop;
        ensureInspectorStyles();
        pop = document.createElement('div');
        pop.id = INSPECTOR_ID;
        pop.hidden = true;
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-label', 'Inspektor Memori Konteks');
        pop.addEventListener('click', (ev) => ev.stopPropagation());
        document.body.appendChild(pop);

        document.addEventListener('click', () => closeContextInspector());
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' && inspectorState.anchor) {
                const anchor = inspectorState.anchor;
                closeContextInspector();
                anchor.focus?.();
            }
        });
        window.addEventListener('resize', positionInspector);
        window.addEventListener('scroll', positionInspector, true);
        return pop;
    }

    function positionInspector() {
        const pop = document.getElementById(INSPECTOR_ID);
        const anchor = inspectorState.anchor;
        if (!pop || pop.hidden || !anchor) return;
        if (!anchor.isConnected || anchor.offsetParent === null) {
            closeContextInspector();
            return;
        }
        if (window.innerWidth <= 640) return; // bottom sheet via CSS
        const r = anchor.getBoundingClientRect();
        const w = pop.offsetWidth;
        const left = Math.min(Math.max(12, r.left), window.innerWidth - w - 12);
        pop.style.left = `${left}px`;
        pop.style.top = `${Math.round(r.bottom + 8)}px`;
    }

    function segment(color, value, max) {
        const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
        return `<span class="gm-seg" style="width:${pct}%;background:${color}"></span>`;
    }

    function legendRow(color, label, value, max) {
        const share = max > 0 ? Math.round((value / max) * 100) : 0;
        return `<li class="gm-row"><span class="gm-dot" style="background:${color}"></span><span>${label}</span>` +
            `<span class="gm-val">${fmt(value)}</span><span class="gm-share">${share}%</span></li>`;
    }

    function renderInspectorContent() {
        const pop = document.getElementById(INSPECTOR_ID);
        const anchor = inspectorState.anchor;
        if (!pop || !anchor || !anchor.__gemmaGauge) return;
        const { breakdown: b, options: o } = anchor.__gemmaGauge;

        const isLight = document.body.classList.contains('light-theme') ||
            document.documentElement.classList.contains('light') ||
            document.body.classList.contains('light');
        pop.classList.toggle('gm-light', isLight);

        const stateMeta = {
            green: { color: '#34d399', label: 'Lega — ruang konteks masih luas' },
            yellow: { color: '#fbbf24', label: 'Diskusi mendalam — konteks mulai padat' },
            orange: { color: '#fb923c', label: 'Hampir penuh — Auto-Compact segera aktif' }
        }[b.state] || { color: '#34d399', label: '' };

        const C = { sys: '#60a5fa', sum: '#a78bfa', hist: '#34d399', free: 'rgba(148,163,184,.35)' };
        const keepRecent = DEFAULT_CONFIG.keepRecentTurns;
        const threshold = DEFAULT_CONFIG.thresholdTurns;
        const canCompact = typeof o.onCompactNow === 'function' && b.totalMessageCount > keepRecent && !inspectorState.busy;
        const canClear = typeof o.onClearSummary === 'function' && b.hasSummary && !inspectorState.busy;
        const windowNote = b.totalMessageCount > b.messageCount
            ? ` (${fmt(b.messageCount)} terbaru dari ${fmt(b.totalMessageCount)} tersimpan)`
            : '';

        pop.innerHTML = `
<div class="gm-head">
  <div>
    <div class="gm-title">Memori Konteks</div>
    <div class="gm-sub">${fmt(b.totalUsed)} / ${fmt(b.maxTokens)} token · ${stateMeta.label}</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px">
    <span class="gm-pct" style="color:${stateMeta.color}">${b.percentage}%</span>
    <button type="button" class="gm-close" aria-label="Tutup inspektor memori">×</button>
  </div>
</div>
<div class="gm-bar" role="img" aria-label="Komposisi pemakaian token konteks">
  ${segment(C.sys, b.systemTokens, b.maxTokens)}${segment(C.sum, b.summaryTokens, b.maxTokens)}${segment(C.hist, b.historyTokens, b.maxTokens)}
</div>
<ul class="gm-legend">
  ${legendRow(C.sys, 'System Prompt', b.systemTokens, b.maxTokens)}
  ${legendRow(C.sum, 'Ringkasan Berjalan', b.summaryTokens, b.maxTokens)}
  ${legendRow(C.hist, `Riwayat Obrolan · ${fmt(b.messageCount)} pesan`, b.historyTokens, b.maxTokens)}
  ${legendRow(C.free, 'Sisa untuk Output AI', b.remainingTokens, b.maxTokens)}
</ul>
<div class="gm-note${b.state === 'orange' ? ' gm-warn' : ''}"></div>
${b.hasSummary ? '<details class="gm-summary"><summary>▸ Lihat isi Ringkasan Berjalan</summary><p></p></details>' : ''}
${(typeof o.onCompactNow === 'function' || typeof o.onClearSummary === 'function') ? `
<div class="gm-actions">
  ${typeof o.onCompactNow === 'function' ? `<button type="button" class="gm-btn gm-primary" data-gm-act="compact" ${canCompact ? '' : 'disabled'}>${inspectorState.busy ? 'Memproses…' : 'Ringkas Sekarang'}</button>` : ''}
  ${typeof o.onClearSummary === 'function' ? `<button type="button" class="gm-btn" data-gm-act="clear" ${canClear ? '' : 'disabled'}>Hapus Ringkasan</button>` : ''}
</div>` : ''}`;

        // Teks dinamis dari pengguna diisi via textContent (aman dari injeksi HTML)
        pop.querySelector('.gm-note').textContent =
            `Estimasi ~3,5 karakter/token${windowNote}. Auto-Compact merangkum otomatis saat riwayat > ${threshold} pesan, menyisakan ${keepRecent} pesan terbaru.`;
        const summaryP = pop.querySelector('.gm-summary p');
        if (summaryP) summaryP.textContent = String(o.sessionSummary || '');

        pop.querySelector('.gm-close').addEventListener('click', () => {
            closeContextInspector();
            anchor.focus?.();
        });
        pop.querySelectorAll('[data-gm-act]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const act = btn.getAttribute('data-gm-act');
                if (act === 'clear' && typeof confirm === 'function' &&
                    !confirm('Hapus Ringkasan Berjalan? Riwayat obrolan tetap utuh, namun konteks lama yang sudah dirangkum akan dilupakan AI.')) return;
                const fn = act === 'compact' ? o.onCompactNow : o.onClearSummary;
                inspectorState.busy = true;
                renderInspectorContent();
                try {
                    await fn();
                } catch (err) {
                    console.warn('[GemmaMemory] Aksi inspektor gagal:', err);
                } finally {
                    inspectorState.busy = false;
                    // updateContextViewer() halaman akan memanggil renderContextGauge -> render ulang otomatis
                    renderInspectorContent();
                }
            });
        });
    }

    function openContextInspector(anchor) {
        if (typeof document === 'undefined' || !anchor) return;
        const pop = getInspector();
        if (inspectorState.anchor && inspectorState.anchor !== anchor) {
            inspectorState.anchor.setAttribute('aria-expanded', 'false');
        }
        inspectorState.anchor = anchor;
        anchor.setAttribute('aria-expanded', 'true');
        renderInspectorContent();
        pop.hidden = false;
        positionInspector();
        requestAnimationFrame(() => pop.classList.add('gm-open'));
        pop.querySelector('.gm-close')?.focus({ preventScroll: true });
    }

    function closeContextInspector() {
        const pop = typeof document !== 'undefined' ? document.getElementById(INSPECTOR_ID) : null;
        if (!pop || pop.hidden) return;
        pop.classList.remove('gm-open');
        pop.hidden = true;
        inspectorState.anchor?.setAttribute('aria-expanded', 'false');
        inspectorState.anchor = null;
    }

    function toggleContextInspector(anchor) {
        if (inspectorState.anchor === anchor) closeContextInspector();
        else openContextInspector(anchor);
    }

    /**
     * Menghapus Ringkasan Berjalan tanpa menyentuh riwayat obrolan.
     */
    function clearStoredSummary(db) {
        if (typeof window !== 'undefined') window.__currentSessionSummary = '';
        return new Promise((resolve) => {
            if (!db) return resolve();
            try {
                const tx = db.transaction('settings', 'readwrite');
                tx.objectStore('settings').delete('current_session_summary');
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch (e) { resolve(); }
        });
    }

    // Expose ke global namespace
    const api = {
        DEFAULT_CONFIG,
        estimateTokens,
        getContextBreakdown,
        renderContextGauge,
        openContextInspector,
        closeContextInspector,
        clearStoredSummary,
        extractHeuristicSummary,
        summarizeMessages,
        summarizeWithFallback: summarizeMessages,
        compactHistory,
        buildPromptContext,
        archiveToKnowledgeBase,
        exportConversationAsMemoryDocument
    };

    global.GemmaMemory = api;

    // Dukungan export untuk lingkungan Node.js (test runner)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

})(typeof window !== 'undefined' ? window : globalThis);
