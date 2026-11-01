/**
 * python-runner.js - Pyodide Offline Python Playground & Interactive REPL
 * Menjalankan kode Python langsung di peramban / Apple WKWebView secara 100% offline
 * menggunakan Pyodide WebAssembly tanpa memerlukan server backend eksternal.
 */
(function (global) {
    'use strict';

    let pyodidePromise = null;
    let pyodideInstance = null;

    /**
     * Menemukan direktori dasar tempat aset Pyodide (wasm & js) tersimpan
     */
    function getPyodideBasePath() {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const target = scripts.find(s => s.src.includes('python-runner') || s.src.includes('pyodide.js'));
        if (target && target.src) {
            return target.src.substring(0, target.src.lastIndexOf('/') + 1);
        }
        return 'assets/js/';
    }

    /**
     * Memuat pustaka pyodide.js ke dalam DOM secara on-demand
     */
    async function ensurePyodideScriptLoaded(basePath) {
        if (typeof global.loadPyodide === 'function') return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${basePath}pyodide.js`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Gagal memuat skrip pyodide.js lokal.'));
            document.head.appendChild(script);
        });
    }

    /**
     * Inisialisasi runtime Pyodide WebAssembly (Lazy Singleton)
     */
    async function getPyodide(onProgress) {
        if (pyodideInstance) return pyodideInstance;
        if (pyodidePromise) return pyodidePromise;

        pyodidePromise = (async () => {
            const basePath = getPyodideBasePath();
            if (typeof onProgress === 'function') onProgress('Memuat skrip runtime Python...');
            await ensurePyodideScriptLoaded(basePath);

            if (typeof global.loadPyodide !== 'function') {
                throw new Error('Fungsi loadPyodide tidak tersedia.');
            }

            if (typeof onProgress === 'function') onProgress('Menginisialisasi Pyodide WebAssembly...');
            const pyodide = await global.loadPyodide({
                indexURL: basePath
            });

            pyodideInstance = pyodide;
            return pyodide;
        })();

        try {
            return await pyodidePromise;
        } catch (err) {
            pyodidePromise = null;
            throw err;
        }
    }

    /**
     * Menyuntikkan style khusus untuk Runner Toolbar dan Output Console
     */
    function ensureStyles() {
        const styleId = 'py-runner-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .py-runner-wrapper {
                position: relative;
                margin: 1rem 0;
                border-radius: 0.75rem;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: #0f1117;
                overflow: hidden;
            }
            .py-runner-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.4rem 0.75rem;
                background: rgba(255, 255, 255, 0.04);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 0.75rem;
            }
            .py-runner-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                color: #38bdf8;
                font-weight: 600;
            }
            .py-runner-badge svg {
                width: 14px;
                height: 14px;
            }
            .py-runner-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .py-runner-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                padding: 0.25rem 0.6rem;
                border-radius: 0.45rem;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(255, 255, 255, 0.06);
                color: #e2e8f0;
                font-size: 0.75rem;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.15s, border-color 0.15s;
            }
            .py-runner-btn:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.14);
                border-color: rgba(255, 255, 255, 0.25);
            }
            .py-runner-btn.py-run-btn {
                background: rgba(34, 197, 94, 0.16);
                border-color: rgba(34, 197, 94, 0.35);
                color: #4ade80;
            }
            .py-runner-btn.py-run-btn:hover:not(:disabled) {
                background: rgba(34, 197, 94, 0.28);
                color: #86efac;
            }
            .py-runner-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .py-runner-output {
                display: none;
                padding: 0.75rem 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                background: #090a0f;
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 0.8rem;
                line-height: 1.5;
                color: #f1f5f9;
                white-space: pre-wrap;
                word-break: break-all;
                max-height: 320px;
                overflow-y: auto;
            }
            .py-runner-output.has-content {
                display: block;
            }
            .py-runner-output-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 0.4rem;
                font-size: 0.7rem;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .py-runner-output.is-error {
                color: #f87171;
                border-top-color: rgba(239, 68, 68, 0.25);
            }
            .py-spinner {
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: currentColor;
                border-radius: 50%;
                animation: py-spin 0.6s linear infinite;
            }
            @keyframes py-spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Menjalankan kode Python dan menangkap output standar (stdout & stderr)
     */
    async function executePython(code, outputContainer, runBtn) {
        ensureStyles();
        const originalContent = runBtn.innerHTML;
        runBtn.disabled = true;
        runBtn.innerHTML = '<span class="py-spinner" aria-hidden="true"></span><span>Menjalankan...</span>';

        outputContainer.className = 'py-runner-output has-content';
        outputContainer.innerHTML = '<div class="py-runner-output-header"><span>Status</span></div><div class="text-slate-400">Menyiapkan runtime Python...</div>';

        const logs = [];
        const startTime = performance.now();

        try {
            const pyodide = await getPyodide(msg => {
                outputContainer.innerHTML = `<div class="py-runner-output-header"><span>Status</span></div><div class="text-sky-400">${msg}</div>`;
            });

            // Redirect stdout & stderr
            pyodide.setStdout({ batched: (str) => logs.push(str) });
            pyodide.setStderr({ batched: (str) => logs.push(`[stderr] ${str}`) });

            // Jalankan kode
            const result = await pyodide.runPythonAsync(code);
            const durationMs = Math.round(performance.now() - startTime);

            let outputText = logs.join('\n').trim();
            if (result !== undefined && result !== null && typeof result.toString === 'function') {
                const resStr = result.toString();
                if (resStr && resStr !== 'None') {
                    outputText = outputText ? `${outputText}\n[Hasil]: ${resStr}` : `[Hasil]: ${resStr}`;
                }
            }

            if (!outputText) {
                outputText = '(Kode berhasil dieksekusi tanpa output cetak)';
            }

            outputContainer.className = 'py-runner-output has-content';
            outputContainer.innerHTML = `
                <div class="py-runner-output-header">
                    <span class="text-emerald-400">Output Selesai (${durationMs}ms)</span>
                    <button type="button" class="text-slate-400 hover:text-white" style="background:none;border:none;cursor:pointer">Bersihkan</button>
                </div>
                <div>${escapeHtml(outputText)}</div>
            `;

            outputContainer.querySelector('button')?.addEventListener('click', () => {
                outputContainer.className = 'py-runner-output';
                outputContainer.innerHTML = '';
            });

        } catch (err) {
            const durationMs = Math.round(performance.now() - startTime);
            outputContainer.className = 'py-runner-output has-content is-error';
            outputContainer.innerHTML = `
                <div class="py-runner-output-header">
                    <span class="text-rose-400">Kesalahan Eksekusi (${durationMs}ms)</span>
                    <button type="button" class="text-slate-400 hover:text-white" style="background:none;border:none;cursor:pointer">Tutup</button>
                </div>
                <div>${escapeHtml(err.message || String(err))}</div>
            `;

            outputContainer.querySelector('button')?.addEventListener('click', () => {
                outputContainer.className = 'py-runner-output';
                outputContainer.innerHTML = '';
            });
        } finally {
            runBtn.disabled = false;
            runBtn.innerHTML = originalContent;
        }
    }

    function escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]);
    }

    /**
     * Membungkus elemen pre code python dengan runner UI
     */
    function enhancePythonCodeBlock(preElement) {
        if (!preElement || preElement.dataset.pyRunnerReady === 'true') return;
        const codeElement = preElement.querySelector('code');
        if (!codeElement) return;

        const lang = (codeElement.className || '').match(/language-(python|py)\b/i);
        if (!lang) return;

        preElement.dataset.pyRunnerReady = 'true';
        ensureStyles();

        const wrapper = document.createElement('div');
        wrapper.className = 'py-runner-wrapper';

        const toolbar = document.createElement('div');
        toolbar.className = 'py-runner-toolbar';
        toolbar.innerHTML = `
            <div class="py-runner-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <span>Python (Pyodide Wasm)</span>
            </div>
            <div class="py-runner-actions">
                <button type="button" class="py-runner-btn py-copy-btn" title="Salin kode ke papan klip">Salin</button>
                <button type="button" class="py-runner-btn py-run-btn" title="Jalankan kode Python lokal">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                    <span>Jalankan</span>
                </button>
            </div>
        `;

        const outputContainer = document.createElement('div');
        outputContainer.className = 'py-runner-output';

        preElement.parentNode.insertBefore(wrapper, preElement);
        wrapper.appendChild(toolbar);
        wrapper.appendChild(preElement);
        wrapper.appendChild(outputContainer);

        const copyBtn = toolbar.querySelector('.py-copy-btn');
        const runBtn = toolbar.querySelector('.py-run-btn');

        copyBtn.addEventListener('click', async () => {
            const rawCode = codeElement.textContent;
            try {
                await navigator.clipboard.writeText(rawCode);
                copyBtn.textContent = 'Tersalin!';
                setTimeout(() => { copyBtn.textContent = 'Salin'; }, 2000);
            } catch (e) {
                copyBtn.textContent = 'Gagal';
            }
        });

        runBtn.addEventListener('click', () => {
            const rawCode = codeElement.textContent;
            executePython(rawCode, outputContainer, runBtn);
        });
    }

    /**
     * Memindai elemen di DOM
     */
    function scan(root = document) {
        if (!(root instanceof Element || root instanceof Document)) return;
        root.querySelectorAll('pre:has(code.language-python), pre:has(code.language-py)').forEach(enhancePythonCodeBlock);

        // Fallback untuk browser lama tanpa dukungan :has()
        root.querySelectorAll('pre > code.language-python, pre > code.language-py').forEach(code => {
            if (code.parentElement) enhancePythonCodeBlock(code.parentElement);
        });
    }

    function init() {
        scan();
        new MutationObserver(records => {
            for (const record of records) {
                for (const node of record.addedNodes) {
                    if (node instanceof Element) scan(node);
                }
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    global.PythonRunner = {
        scan,
        getPyodide,
        executePython
    };

})(typeof window !== 'undefined' ? window : globalThis);
