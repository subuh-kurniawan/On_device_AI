/**
 * intent-enricher.js - Gemma 4 Smart Visual Intent Mapping & Heuristic Engine
 * Memetakan intensi bahasa alami pengguna (alur, grafik, mindmap, matematika)
 * ke sintaks visual yang sesuai (Mermaid flowchart, Chart.js JSON, KaTeX)
 * secara transparan tanpa memerlukan sintaks teknis eksplisit dari pengguna.
 */
(function (global) {
    'use strict';

    // Regex pengenal intensi terarah (flowchart diprioritaskan sebelum grafik/diagram umum)
    const FLOWCHART_PATTERNS = [
        /\b(alur|flowchart|workflow|bagan\s+alir|skema\s+alur|skema\s+proses|langkah\s+kerja|sop|tahapan|siklus)\b/i,
        /\bdiagram\s+(alur|proses|alir|alir\s+data|workflow|kerja|sistem)\b/i,
        /\bproses\s+(pendaftaran|bisnis|login|registrasi|autentikasi|verifikasi|transaksi|kerja)\b/i
    ];

    const MINDMAP_PATTERNS = [
        /\b(mindmap|mind\s*map|peta\s+konsep|pohon\s+topik|pohon\s+tema|kerangka\s+materi|brainstorming)\b/i
    ];

    const CHART_PATTERNS = [
        /\b(grafik|chart|bar\s+chart|line\s+chart|pie\s+chart|diagram\s+batang|diagram\s+lingkaran|diagram\s+garis)\b/i,
        /\b(tren\s+data|statistik|perbandingan\s+data|visualisasi\s+data|plot\s+data|sebaran\s+data)\b/i,
        /\bpersentase\s+(penjualan|pertumbuhan|data|populasi|distribusi)\b/i
    ];

    const MATH_KEYWORDS = /\b(rumus|matematika|matriks|matrix|latex|katex|persamaan|fungsi|integral|turunan|limit|lim|sigma|sum|penjumlahan|pengurangan|perkalian|pembagian|pangkat|akar|determinant|det|baris|kolom|vektor|transpose|trigonometri|identitas)\b/i;
    const FORMULA_PATTERNS = /(\$\$|\$|\\\(|\\\[|\\frac|\\sum|\\int|\\sqrt|\\begin\{matrix\}|\\begin\{pmatrix\})/i;

    function detectIntent(text) {
        const str = String(text || '').trim();
        if (!str) return { type: 'text', matched: null };

        // 1. Cek Flowchart / Alur (prioritas tinggi)
        for (const pattern of FLOWCHART_PATTERNS) {
            const m = str.match(pattern);
            if (m) return { type: 'flowchart', matched: m[0] };
        }

        // 2. Cek Mindmap / Peta Konsep
        for (const pattern of MINDMAP_PATTERNS) {
            const m = str.match(pattern);
            if (m) return { type: 'mindmap', matched: m[0] };
        }

        // 3. Cek Chart / Grafik
        for (const pattern of CHART_PATTERNS) {
            const m = str.match(pattern);
            if (m) return { type: 'chart', matched: m[0] };
        }

        // 4. Cek Rumus / Matematika
        if (MATH_KEYWORDS.test(str) || FORMULA_PATTERNS.test(str)) {
            return { type: 'math', matched: 'math' };
        }

        return { type: 'text', matched: null };
    }

    function shouldForceKaTeX(text) {
        const val = String(text || '').toLowerCase();
        return MATH_KEYWORDS.test(val) || FORMULA_PATTERNS.test(text);
    }

    function enrichPrompt(text) {
        const raw = String(text || '').trim();
        if (!raw) return text;

        const instructions = [];

        // Deteksi Matematika
        if (shouldForceKaTeX(raw)) {
            instructions.push(
                'Bila diskusi berhubungan dengan matematika, rumus, atau konten KaTeX, jawab semua rumus dan ekspresi matematika menggunakan format KaTeX. Gunakan $...$ untuk inline dan $$...$$ untuk tampilan.'
            );
        }

        const intent = detectIntent(raw);

        if (intent.type === 'flowchart') {
            instructions.push(
                'Bila diminta membuat alur, proses, atau flowchart, sajikan visualisasi HANYA menggunakan sintaks Mermaid murni di dalam blok kode ```mermaid diawali dengan "flowchart TD" atau "flowchart LR". Berikan nama node yang jelas dan gunakan panah relasi (-->). Jangan gunakan format ASCII art ataupun teks sebelum diagram.'
            );
        } else if (intent.type === 'mindmap') {
            instructions.push(
                'Bila diminta membuat peta konsep atau mindmap, sajikan visualisasi HANYA menggunakan sintaks Mermaid murni di dalam blok kode ```mermaid diawali dengan "mindmap" dan root((Topik Utama)). Susun cabang hierarki menggunakan indentasi yang rapi.'
            );
        } else if (intent.type === 'chart') {
            instructions.push(
                'Bila diminta membuat grafik atau chart, jawab HANYA dengan konfigurasi JSON Chart.js murni di dalam blok kode ```chart. Contoh format valid:\n```chart\n{ "type": "bar", "data": { "labels": ["A", "B"], "datasets": [{ "label": "Data", "data": [10, 20] }] } }\n```\nJangan berikan kode HTML, fungsi Javascript, ataupun label tambahan. Cukup JSON murni!'
            );
        }

        if (instructions.length > 0) {
            return instructions.join(' ') + '\n' + raw;
        }

        return raw;
    }

    /**
     * Konversi daftar teks bernomor menjadi kode Mermaid Flowchart TD
     * Contoh: "1. Buka web\n2. Klik login\n3. Selesai" -> Mermaid
     */
    function convertNumberedListToFlowchart(text) {
        const lines = String(text || '').split('\n');
        const items = [];
        const itemRegex = /^\s*(?:(\d+)[\.\)]|[-*•])\s+(.+)$/;

        for (const line of lines) {
            const m = line.match(itemRegex);
            if (m && m[2].trim()) {
                items.push(m[2].trim());
            }
        }

        if (items.length < 2) return null;

        const diagramLines = ['flowchart TD'];
        for (let i = 0; i < items.length; i++) {
            const safeLabel = items[i].replace(/"/g, "'").replace(/[\[\]\(\)\{\}]/g, '');
            const nodeId = 'step' + (i + 1);
            diagramLines.push(`    ${nodeId}["${i + 1}. ${safeLabel}"]`);
            if (i > 0) {
                const prevId = 'step' + i;
                diagramLines.push(`    ${prevId} --> ${nodeId}`);
            }
        }

        return diagramLines.join('\n');
    }

    /**
     * Konversi elemen table HTML menjadi konfigurasi Chart.js jika memuat angka
     */
    function convertTableToChartConfig(tableEl) {
        if (!tableEl) return null;
        const headers = Array.from(tableEl.querySelectorAll('thead th, tr:first-child th')).map(th => th.textContent.trim());
        const rows = Array.from(tableEl.querySelectorAll('tbody tr, tr:not(:first-child)'));
        if (rows.length < 2) return null;

        const labels = [];
        const datasetsData = [];
        let seriesLabel = headers[1] || 'Nilai';

        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length >= 2) {
                const labelText = cells[0].textContent.trim();
                const rawVal = cells[1].textContent.trim().replace(/[^\d.-]/g, '');
                const numVal = parseFloat(rawVal);
                if (labelText && !isNaN(numVal)) {
                    labels.push(labelText);
                    datasetsData.push(numVal);
                }
            }
        }

        if (labels.length < 2 || datasetsData.length < 2) return null;

        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: seriesLabel,
                    data: datasetsData
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }

    /**
     * Menganalisis respon AI untuk merekomendasikan aksi visual / tindak lanjut interaktif (Action Chips)
     */
    function suggestActions(aiResponseText) {
        const text = String(aiResponseText || '').trim();
        if (!text) return [];

        const actions = [];
        const hasMermaid = /```(?:mermaid|flowchart|mindmap)/i.test(text);
        const hasChart = /```chart/i.test(text);
        const hasTable = /\|.+\|[\r\n]+\|[-:| ]+\|/i.test(text);
        const hasNumberedList = /(?:^|\n)\s*\d+[\.\)]\s+.+(?:\n\s*\d+[\.\)]\s+.+)+/m.test(text);
        const hasMath = MATH_KEYWORDS.test(text) || FORMULA_PATTERNS.test(text);

        // Rekomendasi Flowchart jika ada daftar berurutan / tahapan tanpa diagram
        if (hasNumberedList && !hasMermaid) {
            actions.push({
                id: 'flowchart',
                icon: '🔀',
                label: 'Bagan Alur (Flowchart)',
                prompt: 'Buatkan diagram alir (Mermaid flowchart TD) dari tahapan atau poin-poin pembahasan di atas.'
            });
        }

        // Rekomendasi Mindmap jika pembahasan luas/bercabang tanpa diagram
        if (!hasMermaid && (text.length > 300 || /(?:bab|sub-bab|topik|kategori|materi|struktur)/i.test(text))) {
            actions.push({
                id: 'mindmap',
                icon: '🗺️',
                label: 'Peta Konsep (Mindmap)',
                prompt: 'Sajikan ringkasan topik di atas dalam bentuk peta konsep / mindmap Mermaid dengan hierarki yang jelas.'
            });
        }

        // Rekomendasi Grafik jika memuat tabel angka atau data statistik tanpa chart
        if ((hasTable || /\b\d+(?:[.,]\d+)?%\b|\bstatistik\b|\bperbandingan data\b/i.test(text)) && !hasChart) {
            actions.push({
                id: 'chart',
                icon: '📊',
                label: 'Grafik Data',
                prompt: 'Visualisasikan data angka atau perbandingan di atas menjadi konfigurasi grafik Chart.js yang menarik.'
            });
        }

        // Rekomendasi Penjabaran Rumus jika ada konsep sains/matematika
        if (hasMath && !/\$\$[\s\S]+\$\$/i.test(text)) {
            actions.push({
                id: 'math',
                icon: '📐',
                label: 'Jabarkan Rumus KaTeX',
                prompt: 'Tuliskan rumus atau formula matematika formal terkait topik ini menggunakan format KaTeX display ($$...$$).'
            });
        }

        // Rekomendasi Ringkasan Padat jika teks panjang
        if (text.length > 500) {
            actions.push({
                id: 'summary',
                icon: '📝',
                label: 'Ringkas Inti',
                prompt: 'Rangkum inti sari pembahasan di atas dalam 3 poin kesimpulan paling penting.'
            });
        }

        return actions.slice(0, 4);
    }

    /**
     * Render elemen visual Smart Action Chips di DOM
     */
    function renderActionChips(container, aiResponseText, onSelectAction) {
        if (!container || !(container instanceof Element)) return null;
        const actions = suggestActions(aiResponseText);
        if (actions.length === 0) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'ai-action-chips flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/5';
        wrapper.setAttribute('role', 'toolbar');
        wrapper.setAttribute('aria-label', 'Saran tindak lanjut visual AI');

        const title = document.createElement('span');
        title.className = 'text-[11px] font-medium text-slate-400 select-none mr-1';
        title.textContent = 'Saran visual:';
        wrapper.appendChild(title);

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer';
            btn.setAttribute('title', action.prompt);
            btn.innerHTML = `<span aria-hidden="true">${action.icon}</span><span>${action.label}</span>`;
            btn.addEventListener('click', () => {
                if (typeof onSelectAction === 'function') {
                    onSelectAction(action);
                } else if (typeof window.sendPromptToAI === 'function') {
                    window.sendPromptToAI(action.prompt);
                } else {
                    const input = document.getElementById('user-input') || document.querySelector('textarea, input[type="text"]');
                    if (input) {
                        input.value = action.prompt;
                        input.focus();
                    }
                }
            });
            wrapper.appendChild(btn);
        });

        container.appendChild(wrapper);
        return wrapper;
    }

    // Expose ke global namespace
    global.GemmaIntent = {
        detectIntent,
        shouldForceKaTeX,
        enrichPrompt,
        convertNumberedListToFlowchart,
        convertTableToChartConfig,
        suggestActions,
        renderActionChips
    };

    // Kompatibilitas mundur dengan fungsi applyKaTeXPrompt yang sudah dipanggil di berbagai halaman
    global.applyKaTeXPrompt = function (text) {
        return global.GemmaIntent.enrichPrompt(text);
    };

})(typeof window !== 'undefined' ? window : globalThis);
