/**
 * AI Advanced Stream Engine & Artifacts Renderer
 * Client-Side In-Browser Streaming, Anti-Flicker Markdown Healing, JSON Repair & Live Artifacts
 * 
 * Fitur:
 * 1. Optimistic Markdown Healer: Menutup tag (```, **, $$, `) yang belum selesai secara otomatis saat streaming.
 * 2. Streaming JSON Repair: Memperbaiki chunk JSON / Tool Calls yang terputus di tengah jalan menjadi JSON valid.
 * 3. Interactive Artifacts (Claude-Style): Panel preview interaktif untuk HTML, SVG, dan Diagram dengan sandboxed iframe.
 * 4. DeepSeek-R1 CoT Stream Harmonizer: Perenderan alur penalaran <think> dengan live timer.
 */

(() => {
    'use strict';

    // ========================================================
    // 1. JSON REPAIR (In-Browser Streaming JSON Healer)
    // ========================================================
    function repairJson(jsonStr) {
        if (!jsonStr || typeof jsonStr !== 'string') return null;
        let str = jsonStr.trim();

        // Bersihkan markdown code fence jika ada
        if (str.startsWith('```json')) str = str.slice(7);
        else if (str.startsWith('```')) str = str.slice(3);
        if (str.endsWith('```')) str = str.slice(0, -3);
        str = str.trim();

        // Coba parsing langsung jika sudah valid
        try {
            return JSON.parse(str);
        } catch (_) {
            // Lanjut proses perbaikan jika tidak valid
        }

        let inString = false;
        let isEscaped = false;
        const stack = [];
        let cleaned = '';

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (inString) {
                if (isEscaped) {
                    isEscaped = false;
                    cleaned += char;
                } else if (char === '\\') {
                    isEscaped = true;
                    cleaned += char;
                } else if (char === '"') {
                    inString = false;
                    cleaned += char;
                } else {
                    cleaned += char;
                }
            } else {
                if (char === '"') {
                    inString = true;
                    cleaned += char;
                } else if (char === '{' || char === '[') {
                    stack.push(char === '{' ? '}' : ']');
                    cleaned += char;
                } else if (char === '}' || char === ']') {
                    if (stack.length && stack[stack.length - 1] === char) {
                        stack.pop();
                    }
                    cleaned += char;
                } else {
                    cleaned += char;
                }
            }
        }

        // Jika string terputus di tengah token
        if (inString) {
            cleaned += '"';
        }

        // Hapus trailing comma yang menggantung
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1').replace(/,\s*$/g, '');

        // Tutup semua kurung kurawal/siku yang belum tertutup
        while (stack.length > 0) {
            cleaned += stack.pop();
        }

        try {
            return JSON.parse(cleaned);
        } catch (e) {
            return null;
        }
    }

    // ========================================================
    // 2. OPTIMISTIC STREAMING MARKDOWN HEALER (Anti-Flicker)
    // ========================================================
    function healIncompleteMarkdown(chunk) {
        if (!chunk || typeof chunk !== 'string') return '';
        let text = chunk;

        // 1. Cek unclosed code fences (```)
        const codeFences = (text.match(/```/g) || []).length;
        if (codeFences % 2 !== 0) {
            text += '\n```';
        }

        // 2. Cek unclosed inline math ($...$) atau display math ($$...$$)
        const doubleDollar = (text.match(/\$\$/g) || []).length;
        if (doubleDollar % 2 !== 0) {
            text += '$$';
        }

        // 3. Cek unclosed bold (**)
        const doubleStars = (text.match(/\*\*/g) || []).length;
        if (doubleStars % 2 !== 0) {
            text += '**';
        }

        // 4. Cek unclosed inline code (`) di luar blok ```
        const backticks = (text.replace(/```[\s\S]*?```/g, '').match(/`/g) || []).length;
        if (backticks % 2 !== 0) {
            text += '`';
        }

        return text;
    }

    // ========================================================
    // 3. ARTIFACTS SYSTEM (Claude-Style Live Preview & Canvas)
    // ========================================================
    function extractAndRenderArtifacts(container) {
        if (!container || !(container instanceof Element)) return;

        // Cari blok pre > code dengan class language-html, language-svg, language-artifact
        const codeBlocks = container.querySelectorAll('pre > code');

        codeBlocks.forEach(codeEl => {
            const preEl = codeEl.parentElement;
            if (!preEl || preEl.dataset.artifactProcessed) return;

            const className = codeEl.className || '';
            const matchLang = className.match(/language-([a-zA-Z0-9_-]+)/);
            const lang = matchLang ? matchLang[1].toLowerCase() : '';

            // Tentukan apakah blok kode ini layak dijadikan interactive artifact
            const isHtml = lang === 'html' || lang === 'htm';
            const isSvg = lang === 'svg';
            const codeRaw = codeEl.textContent || '';

            const isArtifact = isHtml || isSvg || className.includes('artifact') || 
                codeRaw.trim().startsWith('<!DOCTYPE html>') || 
                codeRaw.trim().startsWith('<svg');

            if (!isArtifact || codeRaw.length < 25) return;

            preEl.dataset.artifactProcessed = 'true';

            // Bangun komponen Artifact Card
            const artifactId = 'art-' + Math.random().toString(36).slice(2, 9);
            const artifactCard = document.createElement('div');
            artifactCard.className = 'ai-artifact-card';
            artifactCard.id = artifactId;

            const title = isSvg ? 'Vektor Grafis (SVG)' : 'Aplikasi Web Interaktif (HTML/CSS)';
            const icon = isSvg ? '🎨' : '⚡';

            artifactCard.innerHTML = `
                <div class="ai-artifact-header">
                    <div class="ai-artifact-title">
                        <span class="ai-artifact-icon">${icon}</span>
                        <div>
                            <strong>${title}</strong>
                            <span class="ai-artifact-badge">Live Artifact</span>
                        </div>
                    </div>
                    <div class="ai-artifact-actions">
                        <div class="ai-artifact-tabs">
                            <button type="button" class="ai-art-tab active" data-tab="preview">👁️ Pratinjau</button>
                            <button type="button" class="ai-art-tab" data-tab="code">💻 Kode</button>
                        </div>
                        <button type="button" class="ai-art-btn" title="Salin Kode" data-action="copy">📋</button>
                        <button type="button" class="ai-art-btn" title="Buka Layar Penuh" data-action="fullscreen">⛶</button>
                        <button type="button" class="ai-art-btn" title="Unduh Berkas" data-action="download">⬇️</button>
                    </div>
                </div>
                <div class="ai-artifact-body">
                    <div class="ai-artifact-preview-pane active">
                        ${isSvg ? `<div class="ai-artifact-svg-wrap">${codeRaw}</div>` : `<iframe class="ai-artifact-iframe" sandbox="allow-scripts allow-modals"></iframe>`}
                    </div>
                    <div class="ai-artifact-code-pane"></div>
                </div>
            `;

            // Pindahkan blok pre asli ke panel kode
            const codePane = artifactCard.querySelector('.ai-artifact-code-pane');
            preEl.replaceWith(artifactCard);
            codePane.appendChild(preEl);

            // Jika HTML, muat ke dalam sandboxed iframe
            if (isHtml) {
                const iframe = artifactCard.querySelector('.ai-artifact-iframe');
                if (iframe) {
                    iframe.srcdoc = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <style>body{margin:0;padding:14px;font-family:-apple-system,sans-serif;color:#1e293b;}</style>
                        </head>
                        <body>${codeRaw}</body>
                        </html>
                    `;
                }
            }

            // Pasang event listener tab & aksi
            const tabBtns = artifactCard.querySelectorAll('.ai-art-tab');
            const previewPane = artifactCard.querySelector('.ai-artifact-preview-pane');

            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const tabType = btn.dataset.tab;
                    if (tabType === 'preview') {
                        previewPane.classList.add('active');
                        codePane.classList.remove('active');
                    } else {
                        previewPane.classList.remove('active');
                        codePane.classList.add('active');
                    }
                });
            });

            // Action: Copy
            artifactCard.querySelector('[data-action="copy"]')?.addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                await navigator.clipboard.writeText(codeRaw);
                const old = btn.textContent;
                btn.textContent = '✓';
                setTimeout(() => { btn.textContent = old; }, 1500);
            });

            // Action: Download
            artifactCard.querySelector('[data-action="download"]')?.addEventListener('click', () => {
                const blob = new Blob([codeRaw], { type: isSvg ? 'image/svg+xml' : 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `artifact-${Date.now()}.${isSvg ? 'svg' : 'html'}`;
                a.click();
                URL.revokeObjectURL(url);
            });

            // Action: Fullscreen Modal
            artifactCard.querySelector('[data-action="fullscreen"]')?.addEventListener('click', () => {
                artifactCard.classList.toggle('fullscreen');
            });
        });
    }

    // ========================================================
    // 4. DEEPSEEK-R1 STREAM HARMONIZER (Reasoning Accordion)
    // ========================================================
    function processThinkingStream(rawText, state = { isThinking: false, startTimestamp: null, elapsedSec: 0 }) {
        if (!rawText) return { cleanText: '', thinkingText: '', isThinking: false, elapsedSec: 0 };

        const thinkStartTag = '<think>';
        const thinkEndTag = '</think>';

        let thinkingText = '';
        let cleanText = rawText;
        let isThinking = false;

        const startIndex = rawText.indexOf(thinkStartTag);
        const endIndex = rawText.indexOf(thinkEndTag);

        if (startIndex !== -1) {
            if (!state.startTimestamp) state.startTimestamp = performance.now();

            if (endIndex !== -1) {
                // Selesai berpikir
                thinkingText = rawText.substring(startIndex + thinkStartTag.length, endIndex).trim();
                cleanText = rawText.substring(endIndex + thinkEndTag.length).trim();
                isThinking = false;
                if (!state.elapsedSec) {
                    state.elapsedSec = Math.round((performance.now() - state.startTimestamp) / 100) / 10;
                }
            } else {
                // Masih dalam alur berpikir (streaming)
                thinkingText = rawText.substring(startIndex + thinkStartTag.length).trim();
                cleanText = '';
                isThinking = true;
                state.elapsedSec = Math.round((performance.now() - state.startTimestamp) / 100) / 10;
            }
        }

        return { cleanText, thinkingText, isThinking, elapsedSec: state.elapsedSec };
    }

    // ========================================================
    // 5. EKSPOR GLOBAL (window.AIStreamEngine)
    // ========================================================
    window.AIStreamEngine = {
        repairJson,
        healIncompleteMarkdown,
        extractAndRenderArtifacts,
        processThinkingStream,
        version: '1.0.0'
    };

    console.info('⚡ [AIStreamEngine] Mesin streaming render, JSON repair & Artifacts aktif!');
})();
