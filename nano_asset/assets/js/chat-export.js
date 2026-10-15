/**
 * chat-export.js - Gemma 4 WYSIWYG Chat Exporter
 * Mendukung ekspor percakapan ke DOCX (OOXML lengkap) dan PDF/Cetak (HTML Clean Vektor).
 * Merekam elemen visual apa adanya: Mermaid (vektor/raster), Chart.js (PNG 2x),
 * KaTeX Math, Markdown tables, Code highlighting, dan Lampiran.
 * 100% Offline, Zero-CDN, kompatibel dengan Apple WKWebView dan browser modern.
 */
(function (global) {
    'use strict';

    const EXPORT_CSS_ID = 'gemma-export-styles';

    function escapeXML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Konversi data URL ke ArrayBuffer
     */
    function dataUrlToArrayBuffer(dataUrl) {
        const parts = dataUrl.split(',');
        const mimeMatch = parts[0].match(/^data:(image\/(?:png|jpeg));base64$/i);
        if (!mimeMatch || !parts[1]) {
            throw new Error('Format gambar tidak didukung untuk dokumen Word.');
        }
        const mime = mimeMatch[1].toLowerCase();
        const binaryStr = atob(parts[1]);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return { buffer: bytes.buffer, mime };
    }

    /**
     * Helper mengubah elemen SVG atau Canvas ke Data URL PNG 2x resolusi
     */
    async function svgToPngDataUrl(svgElement, width, height) {
        return new Promise((resolve, reject) => {
            try {
                const serializer = new XMLSerializer();
                let svgString = serializer.serializeToString(svgElement);
                if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
                    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
                }
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = 2;
                    canvas.width = (width || img.naturalWidth || 600) * scale;
                    canvas.height = (height || img.naturalHeight || 400) * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(url);
                    resolve(canvas.toDataURL('image/png', 0.95));
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(null);
                };
                img.src = url;
            } catch (err) {
                resolve(null);
            }
        });
    }

    /**
     * Ekstraksi pesan dari container DOM (#messages) menjadi representasi terstruktur
     */
    async function extractConversationSnapshot(containerElement, options = {}) {
        const container = containerElement || document.getElementById('messages');
        if (!container) return { title: 'Percakapan EduVis AI', messages: [] };

        // Cari semua bubble / baris pesan
        const rawItems = Array.from(container.children);
        const messages = [];

        for (const item of rawItems) {
            // Abaikan placeholder atau elemen sistem yang tidak relevan
            if (item.id === 'initial-placeholder') continue;
            if (item.classList.contains('chat-system-notice')) continue;

            const isUser = item.classList.contains('chat-bubble-user') ||
                item.querySelector('.chat-bubble-user') !== null ||
                item.classList.contains('justify-end') ||
                Boolean(item.innerHTML.includes('Anda') && !item.innerHTML.includes('Gemini AI') && !item.innerHTML.includes('Claude') && !item.innerHTML.includes('EduVis'));

            const sender = isUser ? 'Pengguna (Guru)' : 'Asisten EduVis AI';

            // Ambil konten utama
            const prose = item.querySelector('.prose, .chat-content, .message-content, [class*="prose"]') || item;

            // Kloning node untuk manipulasi tanpa mengganggu UI
            const clone = prose.cloneNode(true);

            // Buang tombol aksi (copy, edit, speak, toolbar mermaid/table, dll)
            const removeSelectors = [
                '.ai-mermaid-toolbar',
                '.ai-table-export-toolbar',
                '.ai-chart-export-toolbar',
                '.message-actions',
                'button',
                '.copy-btn',
                '[data-action]'
            ];
            removeSelectors.forEach(sel => {
                clone.querySelectorAll(sel).forEach(el => el.remove());
            });

            // Bekukan chart canvas menjadi elemen img
            const origCanvases = item.querySelectorAll('canvas');
            const cloneCanvases = clone.querySelectorAll('canvas');
            for (let i = 0; i < origCanvases.length; i++) {
                const origCanvas = origCanvases[i];
                const cloneCanvas = cloneCanvases[i];
                if (origCanvas && cloneCanvas) {
                    try {
                        const chartInstance = (typeof window !== 'undefined' && window.Chart?.getChart)
                            ? window.Chart.getChart(origCanvas)
                            : null;
                        const dataUrl = chartInstance
                            ? chartInstance.toBase64Image('image/png', 2)
                            : origCanvas.toDataURL('image/png');
                        const img = document.createElement('img');
                        img.src = dataUrl;
                        img.className = 'export-frozen-chart';
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        img.style.borderRadius = '8px';
                        cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
                    } catch (e) {
                        console.warn('[GemmaExport] Gagal membekukan canvas chart:', e);
                    }
                }
            }

            // Bekukan SVG Mermaid jika ada
            const origSvgs = item.querySelectorAll('.mermaid svg, svg.mermaid-svg');
            const cloneSvgs = clone.querySelectorAll('.mermaid svg, svg.mermaid-svg');
            for (let i = 0; i < origSvgs.length; i++) {
                const origSvg = origSvgs[i];
                const cloneSvg = cloneSvgs[i];
                if (origSvg && cloneSvg) {
                    try {
                        const bbox = origSvg.getBoundingClientRect();
                        const pngUrl = await svgToPngDataUrl(origSvg, bbox.width || 650, bbox.height || 400);
                        if (pngUrl) {
                            const img = document.createElement('img');
                            img.src = pngUrl;
                            img.className = 'export-frozen-mermaid';
                            img.style.maxWidth = '100%';
                            img.style.height = 'auto';
                            cloneSvg.parentNode.replaceChild(img, cloneSvg);
                        }
                    } catch (e) {
                        console.warn('[GemmaExport] Gagal mengonversi SVG ke PNG:', e);
                    }
                }
            }

            messages.push({
                sender: sender,
                isUser: isUser,
                html: clone.innerHTML,
                text: clone.textContent.trim(),
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
        }

        return {
            title: options.title || 'Riwayat Percakapan EduVis AI',
            exportedAt: new Date().toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            messages: messages
        };
    }

    /**
     * Generator HTML Standalone (Print / PDF View)
     * Menghasilkan dokumen cetak bersih (Clean Print View) dengan tipografi A4 yang optimal.
     */
    function generateCleanHtmlDoc(snapshot, options = {}) {
        const theme = options.theme || 'print'; // 'print' = latar putih bersih, hemat tinta
        return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>${escapeHTML(snapshot.title)}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 18mm 15mm 18mm 15mm;
        }
        @media print {
            .gemma-export-document { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
        .gemma-export-document {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            line-height: 1.6;
            margin: 0;
            padding: 24px;
            font-size: 13px;
            box-sizing: border-box;
        }
        .header {
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 14px;
            margin-bottom: 24px;
        }
        .header h1 {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 6px 0;
        }
        .header .meta {
            font-size: 11px;
            color: #64748b;
        }
        .message-block {
            margin-bottom: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .message-block.user {
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
        }
        .message-block.assistant {
            background-color: #ffffff;
            border-left: 4px solid #10b981;
        }
        .sender-badge {
            font-weight: 700;
            font-size: 12px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .sender-badge.user { color: #1d4ed8; }
        .sender-badge.assistant { color: #047857; }
        .sender-badge .time {
            font-weight: 400;
            font-size: 10px;
            color: #94a3b8;
        }
        .content {
            font-size: 12.5px;
            color: #334155;
        }
        .content pre {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
            overflow-x: auto;
            font-family: ui-monospace, "SF Mono", "Fira Code", monospace;
            font-size: 11px;
            break-inside: avoid;
        }
        .content code {
            font-family: ui-monospace, "SF Mono", "Fira Code", monospace;
            background: #f1f5f9;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 11px;
        }
        .content table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 11.5px;
            break-inside: avoid;
        }
        .content th, .content td {
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            text-align: left;
        }
        .content th {
            background-color: #f8fafc;
            font-weight: 600;
        }
        .content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 12px auto;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            break-inside: avoid;
        }
        .footer {
            margin-top: 32px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
<main class="gemma-export-document">
    <div class="header">
        <h1>${escapeHTML(snapshot.title)}</h1>
        <div class="meta">Dibuat secara lokal melalui EduVis AI Gallery · ${escapeHTML(snapshot.exportedAt)}</div>
    </div>
    <div class="conversation">
        ${snapshot.messages.map(msg => `
            <div class="message-block ${msg.isUser ? 'user' : 'assistant'}">
                <div class="sender-badge ${msg.isUser ? 'user' : 'assistant'}">
                    <span>${msg.isUser ? '👤 ' : '🤖 '}${escapeHTML(msg.sender)}</span>
                    <span class="time">${escapeHTML(msg.timestamp)}</span>
                </div>
                <div class="content">
                    ${msg.html}
                </div>
            </div>
        `).join('')}
    </div>
    <div class="footer">
        Dokumen ini dibuat otomatis secara offline di perangkat pengguna.
    </div>
</main>
</body>
</html>`;
    }

    /**
     * Membuat PDF bersih dengan html2pdf, lalu memakai dialog cetak sebagai fallback.
     */
    async function printToPdf(snapshot, options = {}) {
        const htmlDoc = generateCleanHtmlDoc(snapshot, options);
        const filename = options.filename || `Riwayat_EduVis_${Date.now()}.pdf`;

        if (typeof globalThis.html2pdf !== 'function') {
            const loader = rootWindow.ensureHtml2Pdf || (
                typeof rootWindow.loadScriptOnce === 'function'
                    ? () => rootWindow.loadScriptOnce('nano_asset/assets/js/html2pdf.bundle.min.js')
                    : null
            );
            if (loader) {
                await loader();
                if (typeof globalThis.html2pdf !== 'function') {
                    throw new Error('Library pembuat PDF gagal dimuat. Periksa aset lokal dan coba lagi.');
                }
            }
        }

        if (typeof globalThis.html2pdf === 'function') {
            const tempRoot = document.createElement('div');
            tempRoot.id = 'gemma-export-render-root';
            tempRoot.style.position = 'fixed';
            tempRoot.style.left = '0';
            tempRoot.style.top = '0';
            tempRoot.style.width = '794px';
            tempRoot.style.opacity = '0';
            tempRoot.style.pointerEvents = 'none';
            tempRoot.style.zIndex = '-1';
            tempRoot.innerHTML = htmlDoc;
            document.body.appendChild(tempRoot);

            try {
                const pdfBlob = await globalThis.html2pdf()
                    .set({
                        margin: 10,
                        filename,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff',
                            onclone: clonedDocument => {
                                const clonedRoot = clonedDocument.getElementById('gemma-export-render-root');
                                if (clonedRoot) {
                                    clonedRoot.style.opacity = '1';
                                    clonedRoot.style.zIndex = '2147483647';
                                }
                            }
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    })
                    .from(tempRoot.querySelector('.gemma-export-document'))
                    .output('blob');

                return saveDocumentBlob(filename, pdfBlob);
            } catch (err) {
                console.warn('[GemmaExport] html2pdf gagal, fallback ke print iframe:', err);
            } finally {
                tempRoot.remove();
            }
        }

        let iframe = document.getElementById('gemma-print-iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'gemma-print-iframe';
            iframe.style.position = 'fixed';
            iframe.style.inset = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = '0';
            iframe.style.zIndex = '2147483647';
            iframe.style.background = '#ffffff';
            document.body.appendChild(iframe);
        }

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlDoc);
        iframeDoc.close();

        await new Promise(resolve => setTimeout(resolve, 350));
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return { success: true };
    }

    /**
     * Pembangun Dokumen DOCX Asli Berbasis OOXML & JSZip
     * Merekam struktur teks, format tebal/miring, heading, tabel native Word,
     * dan menyisipkan gambar media/diagram/chart secara utuh di word/media/.
     */
    async function generateDocxBlob(snapshot, options = {}) {
        let JSZipLib = (typeof JSZip !== 'undefined') ? JSZip : (global.JSZip || options.JSZip || null);
        if (!JSZipLib && typeof require !== 'undefined') {
            try {
                JSZipLib = require('./jszip.min.js');
            } catch (_) {
                try {
                    const path = require('path');
                    JSZipLib = require(path.join(__dirname, 'jszip.min.js'));
                } catch (__) {
                    try {
                        const path = require('path');
                        JSZipLib = require(path.join(process.cwd(), 'nano_asset/assets/js/jszip.min.js'));
                    } catch (___) {}
                }
            }
        }
        // Di runtime browser/WKWebView, JSZip mungkin belum termuat sebagai global.
        // Muat on-demand (cermin dari loader html2pdf pada printToPdf) sebelum menyerah.
        if (!JSZipLib && rootWindow && rootWindow.document) {
            const loader = rootWindow.ensureZipSave || (
                typeof rootWindow.loadScriptOnce === 'function'
                    ? () => rootWindow.loadScriptOnce('nano_asset/assets/js/jszip.min.js')
                    : null
            );
            if (loader) {
                try {
                    await loader();
                } catch (loaderError) {
                    console.warn('[GemmaExport] Gagal memuat JSZip secara on-demand:', loaderError);
                }
                JSZipLib = (typeof JSZip !== 'undefined') ? JSZip : (global.JSZip || options.JSZip || null);
            }
        }
        if (!JSZipLib) {
            throw new Error('Pustaka JSZip tidak tersedia untuk menghasilkan file DOCX.');
        }

        const zip = new JSZipLib();
        const mediaFiles = []; // { rId, fileName, buffer, contentType }
        const externalRels = []; // { rId, url } — hyperlink eksternal
        let relIdCounter = 1;
        let imageCounter = 1;
        let linkCounter = 1;

        // Kumpulkan gambar dan siapkan relasi
        function registerImage(dataUrl) {
            if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;
            const rId = `rIdImg${relIdCounter++}`;
            const ext = dataUrl.includes('image/jpeg') ? 'jpeg' : 'png';
            const fileName = `image_${imageCounter++}.${ext}`;
            const parsed = dataUrlToArrayBuffer(dataUrl);
            mediaFiles.push({
                rId: rId,
                fileName: fileName,
                buffer: parsed.buffer,
                contentType: parsed.mime
            });
            return { rId, fileName };
        }

        // Daftarkan hyperlink eksternal (TargetMode="External") dan kembalikan rId-nya
        function registerHyperlink(url) {
            const safeUrl = String(url || '').trim();
            if (!safeUrl) return null;
            const existing = externalRels.find(rel => rel.url === safeUrl);
            if (existing) return existing.rId;
            const rId = `rIdLink${linkCounter++}`;
            externalRels.push({ rId, url: safeUrl });
            return rId;
        }

        const TEXT_NODE = 3;
        const ELEMENT_NODE = 1;

        function parseHtmlToNodesFallback(htmlString) {
            const nodes = [];
            let cleaned = String(htmlString).replace(/<!--[\s\S]*?-->/g, '');
            // Tag berpasangan umum + tag void (img/hr/br). Alternasi terakhir
            // menangkap teks biasa. Fallback ini dipakai saat DOMParser tidak
            // tersedia (mis. lingkungan Node pada pengujian).
            const tagRegex = /<(p|h[1-6]|table|pre|ul|ol|div|blockquote|li|a|span|strong|b|em|i|u|s|del|ins|strike|code)([^>]*)>([\s\S]*?)<\/\1>|<(img|hr|br)([^>]*?)\/?>|([^<]+)/gi;
            let match;
            while ((match = tagRegex.exec(cleaned)) !== null) {
                if (match[6] !== undefined) {
                    const txt = match[6].trim();
                    if (txt) nodes.push({ nodeType: TEXT_NODE, textContent: txt, childNodes: [] });
                } else if (match[1]) {
                    const tagName = match[1].toLowerCase();
                    const attrs = match[2];
                    const inner = match[3];
                    nodes.push(createSimpleElement(tagName, attrs, inner));
                } else if (match[4]) {
                    nodes.push(createSimpleElement(match[4].toLowerCase(), match[5], ''));
                }
            }
            return nodes;
        }

        function createSimpleElement(tagName, attrStr, innerHtml) {
            const el = {
                nodeType: ELEMENT_NODE,
                tagName: tagName.toUpperCase(),
                textContent: innerHtml.replace(/<[^>]+>/g, ''),
                childNodes: [],
                getAttribute: (attr) => {
                    const m = new RegExp(`${attr}=["']([^"']*)["']`, 'i').exec(attrStr);
                    return m ? m[1] : null;
                },
                querySelectorAll: (selector) => {
                    const results = [];
                    if (selector === 'tr') {
                        const trMatches = innerHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
                        trMatches.forEach(trHtml => {
                            results.push(createSimpleElement('tr', '', trHtml.replace(/<\/?tr[^>]*>/gi, '')));
                        });
                    } else if (selector.includes('th') || selector.includes('td')) {
                        const cellMatches = innerHtml.match(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
                        cellMatches.forEach(cHtml => {
                            const tag = cHtml.startsWith('<th') ? 'th' : 'td';
                            results.push(createSimpleElement(tag, '', cHtml.replace(/<\/?(th|td)[^>]*>/gi, '')));
                        });
                    } else if (selector === 'li') {
                        const liMatches = innerHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
                        liMatches.forEach(liHtml => {
                            results.push(createSimpleElement('li', '', liHtml.replace(/<\/?li[^>]*>/gi, '')));
                        });
                    }
                    return results;
                }
            };
            if (innerHtml && tagName !== 'table' && tagName !== 'pre') {
                el.childNodes = parseHtmlToNodesFallback(innerHtml);
            }
            return el;
        }

        async function normalizeEmbeddedImages(html) {
            if (typeof DOMParser === 'undefined' || typeof Image === 'undefined') return html;

            const parsedDocument = new DOMParser().parseFromString(
                `<div class="docx-content">${html}</div>`,
                'text/html'
            );
            const content = parsedDocument.body.firstElementChild;
            const embeddedImages = Array.from(content.querySelectorAll('img[src^="data:image/"]'));

            await Promise.all(embeddedImages.map(async image => {
                const source = image.getAttribute('src');
                if (!source || /^data:image\/png;base64,/i.test(source)) return;

                await new Promise((resolve, reject) => {
                    const raster = new Image();
                    raster.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = raster.naturalWidth;
                            canvas.height = raster.naturalHeight;
                            const context = canvas.getContext('2d');
                            if (!context) throw new Error('Tidak dapat menyiapkan kanvas untuk gambar Word.');
                            context.drawImage(raster, 0, 0);
                            image.setAttribute('src', canvas.toDataURL('image/png'));
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    raster.onerror = () => reject(new Error('Gambar percakapan tidak dapat disiapkan untuk Word.'));
                    raster.src = source;
                });
            }));

            return content.innerHTML;
        }

        // Parse HTML potongan menjadi elemen Word XML (w:p, w:tbl, dsb)
        function convertHtmlToOpenXml(htmlString) {
            let rootNodes = [];
            if (typeof DOMParser !== 'undefined') {
                const parser = new DOMParser();
                const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html');
                rootNodes = Array.from(doc.body.childNodes);
            } else {
                rootNodes = parseHtmlToNodesFallback(htmlString);
            }
            let xml = '';

            function walkNode(node) {
                if (node.nodeType === TEXT_NODE) {
                    const text = node.textContent;
                    if (text && text.trim()) {
                        return `<w:r><w:t xml:space="preserve">${escapeXML(text)}</w:t></w:r>`;
                    }
                    return '';
                }

                if (node.nodeType !== ELEMENT_NODE) return '';

                const tag = node.tagName.toLowerCase();

                if (tag === 'img') {
                    const src = node.getAttribute('src');
                    const imgReg = registerImage(src);
                    if (imgReg) {
                        // Sisipkan inline drawing OpenXML (lebar ~5000000 dxa ~ 5.5 inci)
                        return `
                        <w:p>
                            <w:r>
                                <w:drawing>
                                    <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
                                        <wp:extent cx="4800000" cy="2700000"/>
                                        <wp:docPr id="${relIdCounter}" name="${imgReg.fileName}"/>
                                        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                                            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                                                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                                                    <pic:nvPicPr>
                                                        <pic:cNvPr id="${relIdCounter}" name="${imgReg.fileName}"/>
                                                        <pic:cNvPicPr/>
                                                    </pic:nvPicPr>
                                                    <pic:blipFill>
                                                        <a:blip r:embed="${imgReg.rId}"/>
                                                        <a:stretch><a:fillRect/></a:stretch>
                                                    </pic:blipFill>
                                                    <pic:spPr>
                                                        <a:xfrm><a:off x="0" y="0"/><a:ext cx="4800000" cy="2700000"/></a:xfrm>
                                                        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                                                    </pic:spPr>
                                                </pic:pic>
                                            </a:graphicData>
                                        </a:graphic>
                                    </wp:inline>
                                </w:drawing>
                            </w:r>
                        </w:p>`;
                    }
                    return '';
                }

                if (tag === 'table') {
                    let tblXml = '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>' +
                        '<w:top w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>' +
                        '<w:left w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>' +
                        '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>' +
                        '<w:right w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>' +
                        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>' +
                        '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>' +
                        '</w:tblBorders></w:tblPr>';

                    const rows = node.querySelectorAll('tr');

                    // OOXML mewajibkan <w:tblGrid> (satu <w:gridCol> per kolom) tepat
                    // setelah <w:tblPr>. Tanpa ini Microsoft Word menolak membuka berkas.
                    const firstRowCells = rows.length ? rows[0].querySelectorAll('th, td').length : 0;
                    const colCount = Math.max(firstRowCells, 1);
                    const colWidth = Math.floor(9000 / colCount);
                    let gridXml = '<w:tblGrid>';
                    for (let c = 0; c < colCount; c++) {
                        gridXml += `<w:gridCol w:w="${colWidth}"/>`;
                    }
                    gridXml += '</w:tblGrid>';
                    tblXml += gridXml;

                    rows.forEach((tr, rIdx) => {
                        tblXml += '<w:tr>';
                        const cells = tr.querySelectorAll('th, td');
                        cells.forEach(td => {
                            const isHeader = rIdx === 0 || td.tagName.toLowerCase() === 'th';
                            tblXml += `<w:tc><w:tcPr>${isHeader ? '<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>' : ''}</w:tcPr>` +
                                `<w:p><w:r><w:rPr>${isHeader ? '<w:b/>' : ''}</w:rPr>` +
                                `<w:t>${escapeXML(td.textContent.trim())}</w:t></w:r></w:p></w:tc>`;
                        });
                        tblXml += '</w:tr>';
                    });
                    tblXml += '</w:tbl>';
                    return tblXml;
                }

                if (/^h[1-6]$/.test(tag)) {
                    const sz = tag === 'h1' ? '36' : (tag === 'h2' ? '30' : '26');
                    return `<w:p><w:pPr><w:pStyle w:val="Heading${tag[1]}"/><w:spacing w:before="180" w:after="80"/></w:pPr>` +
                        `<w:r><w:rPr><w:b/><w:color w:val="1E293B"/><w:sz w:val="${sz}"/></w:rPr>` +
                        `<w:t>${escapeXML(node.textContent.trim())}</w:t></w:r></w:p>`;
                }

                if (tag === 'pre') {
                    return `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/><w:spacing w:before="120" w:after="120"/></w:pPr>` +
                        `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:color w:val="0F172A"/><w:sz w:val="20"/></w:rPr>` +
                        `<w:t xml:space="preserve">${escapeXML(node.textContent)}</w:t></w:r></w:p>`;
                }

                if (tag === 'ul' || tag === 'ol') {
                    // Daftar Word asli memakai numbering (numPr) agar bullet/penomoran
                    // ditangani Word secara native, bukan karakter manual.
                    const numId = tag === 'ol' ? 2 : 1;
                    let listXml = '';
                    const items = node.querySelectorAll(':scope > li');
                    const liList = items.length ? Array.from(items) : Array.from(node.querySelectorAll('li'));
                    liList.forEach((li) => {
                        const inner = renderInlineChildren(li);
                        listXml += `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr><w:spacing w:after="40"/></w:pPr>${inner}</w:p>`;
                    });
                    return listXml;
                }

                if (tag === 'blockquote') {
                    const inner = renderInlineChildren(node);
                    return `<w:p><w:pPr><w:pStyle w:val="Quote"/><w:pBdr><w:left w:val="single" w:sz="18" w:space="10" w:color="94A3B8"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr>${inner}</w:p>`;
                }

                if (tag === 'hr') {
                    return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CBD5E1"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>`;
                }

                if (tag === 'a') {
                    // Hyperlink klik melalui relasi eksternal
                    const href = node.getAttribute('href');
                    const rId = registerHyperlink(href);
                    const label = escapeXML(node.textContent.trim() || href || 'tautan');
                    if (rId) {
                        return `<w:hyperlink r:id="${rId}"><w:r><w:rPr><w:color w:val="2563EB"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${label}</w:t></w:r></w:hyperlink>`;
                    }
                    return `<w:r><w:rPr><w:color w:val="2563EB"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${label}</w:t></w:r>`;
                }

                // Node inline / formatting biasa
                let inner = '';
                node.childNodes.forEach(child => {
                    inner += walkNode(child);
                });

                if (tag === 'p') {
                    return `<w:p><w:pPr><w:spacing w:after="100"/></w:pPr>${inner}</w:p>`;
                } else if (tag === 'strong' || tag === 'b') {
                    return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXML(node.textContent)}</w:t></w:r>`;
                } else if (tag === 'em' || tag === 'i') {
                    return `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${escapeXML(node.textContent)}</w:t></w:r>`;
                } else if (tag === 'u' || tag === 'ins') {
                    return `<w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${escapeXML(node.textContent)}</w:t></w:r>`;
                } else if (tag === 's' || tag === 'del' || tag === 'strike') {
                    return `<w:r><w:rPr><w:strike/></w:rPr><w:t xml:space="preserve">${escapeXML(node.textContent)}</w:t></w:r>`;
                } else if (tag === 'code') {
                    return `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:color w:val="4F46E5"/></w:rPr><w:t xml:space="preserve">${escapeXML(node.textContent)}</w:t></w:r>`;
                }

                return inner;
            }

            // Render anak-anak sebuah node sebagai run inline (tanpa membungkus <w:p>),
            // dipakai untuk isi <li> dan <blockquote> yang paragrafnya sudah disediakan.
            function renderInlineChildren(container) {
                let inline = '';
                container.childNodes.forEach(child => {
                    const childTag = child.nodeType === ELEMENT_NODE ? child.tagName.toLowerCase() : '';
                    if (childTag === 'ul' || childTag === 'ol') {
                        // Daftar bersarang: naikkan satu tingkat indentasi
                        const numId = childTag === 'ol' ? 2 : 1;
                        const nested = child.querySelectorAll(':scope > li');
                        const nestedList = nested.length ? Array.from(nested) : Array.from(child.querySelectorAll('li'));
                        nestedList.forEach(li => {
                            const liInner = renderInlineChildren(li);
                            inline += `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="1"/><w:numId w:val="${numId}"/></w:numPr><w:spacing w:after="40"/></w:pPr>${liInner}</w:p>`;
                        });
                        return;
                    }
                    if (childTag === 'p') {
                        inline += renderInlineChildren(child);
                        return;
                    }
                    inline += walkNode(child);
                });
                return inline;
            }

            // Susun keluaran walkNode di tingkat akar. Konten blok (<w:p>, <w:tbl>)
            // ditulis langsung; run inline berurutan (<w:r>/<w:hyperlink>) dikumpulkan
            // lalu dibungkus <w:p> agar tidak pernah berdiri telanjang di <w:body>
            // (Word menolak run langsung di bawah body).
            let pendingInline = '';
            const flushInline = () => {
                if (pendingInline.trim()) {
                    xml += `<w:p><w:pPr><w:spacing w:after="100"/></w:pPr>${pendingInline}</w:p>`;
                }
                pendingInline = '';
            };
            rootNodes.forEach(child => {
                const fragment = walkNode(child);
                if (!fragment) return;
                if (/^\s*<(w:p|w:tbl)\b/.test(fragment)) {
                    flushInline();
                    xml += fragment;
                } else {
                    pendingInline += fragment;
                }
            });
            flushInline();

            return xml;
        }

        // Bangun isi dokumen word/document.xml
        const wantCover = options.coverPage !== false;
        const wantToc = options.toc !== false;

        let docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
    <w:body>`;

        // --- Sampul dokumen (cover page) ---
        if (wantCover) {
            docXml += `
        <w:p><w:pPr><w:spacing w:before="2400"/></w:pPr></w:p>
        <w:p>
            <w:pPr><w:pStyle w:val="Title"/><w:spacing w:after="120"/></w:pPr>
            <w:r><w:rPr><w:b/><w:color w:val="1E3A8A"/><w:sz w:val="56"/></w:rPr><w:t>${escapeXML(snapshot.title)}</w:t></w:r>
        </w:p>
        <w:p>
            <w:pPr><w:spacing w:after="120"/></w:pPr>
            <w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="24"/></w:rPr><w:t>Transkrip Percakapan</w:t></w:r>
        </w:p>
        <w:p>
            <w:pPr><w:spacing w:after="60"/></w:pPr>
            <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="20"/></w:rPr><w:t>Diarsipkan pada: ${escapeXML(snapshot.exportedAt)}</w:t></w:r>
        </w:p>
        <w:p>
            <w:pPr><w:spacing w:after="60"/></w:pPr>
            <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="20"/></w:rPr><w:t>EduVis AI Gallery</w:t></w:r>
        </w:p>
        <w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
        }

        // --- Daftar Isi (Table of Contents) ---
        if (wantToc) {
            docXml += `
        <w:p>
            <w:pPr><w:pStyle w:val="TOCHeading"/><w:spacing w:after="160"/></w:pPr>
            <w:r><w:rPr><w:b/><w:color w:val="1E3A8A"/><w:sz w:val="32"/></w:rPr><w:t>Daftar Isi</w:t></w:r>
        </w:p>
        <w:p>
            <w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>
            <w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r>
            <w:r><w:fldChar w:fldCharType="separate"/></w:r>
            <w:r><w:rPr><w:color w:val="94A3B8"/></w:rPr><w:t xml:space="preserve">Klik kanan lalu pilih "Update Field" untuk memperbarui daftar isi.</w:t></w:r>
            <w:r><w:fldChar w:fldCharType="end"/></w:r>
        </w:p>
        <w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
        }

        // --- Judul bagian percakapan ---
        docXml += `
        <w:p>
            <w:pPr>
                <w:pStyle w:val="Heading1"/>
                <w:spacing w:before="0" w:after="120"/>
            </w:pPr>
            <w:r>
                <w:rPr><w:b/><w:color w:val="1E3A8A"/><w:sz w:val="44"/></w:rPr>
                <w:t>${escapeXML(snapshot.title)}</w:t>
            </w:r>
        </w:p>`;

        docXml += `
        <w:p>
            <w:pPr><w:spacing w:after="240"/></w:pPr>
            <w:r>
                <w:rPr><w:color w:val="64748B"/><w:sz w:val="20"/></w:rPr>
                <w:t>Diarsipkan pada: ${escapeXML(snapshot.exportedAt)} · EduVis AI Gallery</w:t>
            </w:r>
        </w:p>`;

        // Tambahkan tiap pesan obrolan
        for (const sourceMessage of snapshot.messages) {
            const msg = {
                ...sourceMessage,
                html: await normalizeEmbeddedImages(sourceMessage.html)
            };
            const senderBg = msg.isUser ? 'EFF6FF' : 'ECFDF5';
            const senderColor = msg.isUser ? '1D4ED8' : '047857';

            docXml += `
        <w:p>
            <w:pPr>
                <w:shd w:val="clear" w:color="auto" w:fill="${senderBg}"/>
                <w:spacing w:before="160" w:after="60"/>
            </w:pPr>
            <w:r>
                <w:rPr><w:b/><w:color w:val="${senderColor}"/><w:sz w:val="22"/></w:rPr>
                <w:t>${escapeXML(msg.sender)}</w:t>
            </w:r>
        </w:p>`;

            docXml += convertHtmlToOpenXml(msg.html);

            // Garis pembatas halus
            docXml += `
        <w:p>
            <w:pPr>
                <w:pBdr><w:bottom w:val="single" w:sz="4" w:space="8" w:color="E2E8F0"/></w:pBdr>
                <w:spacing w:after="140"/>
            </w:pPr>
        </w:p>`;
        }

        docXml += `
        <w:sectPr>
            <w:headerReference w:type="default" r:id="rIdHeader1"/>
            <w:footerReference w:type="default" r:id="rIdFooter1"/>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
        </w:sectPr>
    </w:body>
</w:document>`;

        const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
        <w:name w:val="Normal"/>
        <w:qFormat/>
        <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:sz w:val="22"/>
            <w:szCs w:val="22"/>
        </w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading1">
        <w:name w:val="heading 1"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:rPr>
            <w:b/>
            <w:color w:val="1E3A8A"/>
            <w:sz w:val="32"/>
        </w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading2">
        <w:name w:val="heading 2"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:rPr>
            <w:b/>
            <w:color w:val="0F172A"/>
            <w:sz w:val="28"/>
        </w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading3">
        <w:name w:val="heading 3"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:rPr><w:b/><w:color w:val="1E293B"/><w:sz w:val="26"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading4">
        <w:name w:val="heading 4"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:rPr><w:b/><w:color w:val="1E293B"/><w:sz w:val="24"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading5">
        <w:name w:val="heading 5"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:rPr><w:b/><w:color w:val="1E293B"/><w:sz w:val="22"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading6">
        <w:name w:val="heading 6"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:rPr><w:b/><w:color w:val="1E293B"/><w:sz w:val="22"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Title">
        <w:name w:val="Title"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:rPr><w:b/><w:color w:val="1E3A8A"/><w:sz w:val="56"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="TOCHeading">
        <w:name w:val="TOC Heading"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:rPr><w:b/><w:color w:val="1E3A8A"/><w:sz w:val="32"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="ListParagraph">
        <w:name w:val="List Paragraph"/>
        <w:basedOn w:val="Normal"/>
        <w:pPr><w:spacing w:after="40"/><w:contextualSpacing/></w:pPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Quote">
        <w:name w:val="Quote"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="10" w:color="94A3B8"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr>
        <w:rPr><w:i/><w:color w:val="475569"/></w:rPr>
    </w:style>
    <w:style w:type="character" w:styleId="Hyperlink">
        <w:name w:val="Hyperlink"/>
        <w:rPr><w:color w:val="2563EB"/><w:u w:val="single"/></w:rPr>
    </w:style>
</w:styles>`;

        // Daftar bernomor & bullet (numbering.xml) — dipakai oleh <w:numPr> pada list
        const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:abstractNum w:abstractNumId="0">
        <w:multiLevelType w:val="hybridMultilevel"/>
        <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="bullet"/>
            <w:lvlText w:val="•"/>
            <w:lvlJc w:val="left"/>
            <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
            <w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>
        </w:lvl>
        <w:lvl w:ilvl="1">
            <w:start w:val="1"/>
            <w:numFmt w:val="bullet"/>
            <w:lvlText w:val="o"/>
            <w:lvlJc w:val="left"/>
            <w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr>
            <w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:hint="default"/></w:rPr>
        </w:lvl>
    </w:abstractNum>
    <w:abstractNum w:abstractNumId="1">
        <w:multiLevelType w:val="hybridMultilevel"/>
        <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%1."/>
            <w:lvlJc w:val="left"/>
            <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
        </w:lvl>
        <w:lvl w:ilvl="1">
            <w:start w:val="1"/>
            <w:numFmt w:val="lowerLetter"/>
            <w:lvlText w:val="%2."/>
            <w:lvlJc w:val="left"/>
            <w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr>
        </w:lvl>
    </w:abstractNum>
    <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
    <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

        // Header: judul dokumen di kanan atas (setiap halaman)
        const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <w:p>
        <w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="E2E8F0"/></w:pBdr><w:spacing w:after="60"/><w:jc w:val="right"/></w:pPr>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:t>${escapeXML(snapshot.title)}</w:t></w:r>
    </w:p>
</w:hdr>`;

        // Footer: penanda halaman "Halaman X dari Y" (field PAGE / NUMPAGES)
        const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <w:p>
        <w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="E2E8F0"/></w:pBdr><w:spacing w:before="60"/><w:jc w:val="center"/></w:pPr>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">Halaman </w:t></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve"> dari </w:t></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r>
        <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
    </w:p>
</w:ftr>`;

        const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dc:title>${escapeXML(snapshot.title)}</dc:title>
    <dc:creator>EduVis AI Gallery</dc:creator>
    <cp:lastModifiedBy>EduVis AI Gallery</cp:lastModifiedBy>
    <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
    <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;

        const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
    <Application>EduVis AI Gallery</Application>
</Properties>`;

        // 1. [Content_Types].xml
        let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Default Extension="png" ContentType="image/png"/>
    <Default Extension="jpeg" ContentType="image/jpeg"/>
    <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
    <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
    <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
    <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
    <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;

        // 2. _rels/.rels
        let relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

        // 3. word/_rels/document.xml.rels
        let wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
    <Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
    <Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
    <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>`;
        for (const media of mediaFiles) {
            wordRelsXml += `
    <Relationship Id="${media.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${media.fileName}"/>`;
        }
        for (const rel of externalRels) {
            wordRelsXml += `
    <Relationship Id="${rel.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXML(rel.url)}" TargetMode="External"/>`;
        }
        wordRelsXml += `
</Relationships>`;

        // PENTING: Spesifikasi OPC/OOXML mewajibkan [Content_Types].xml menjadi
        // entri PERTAMA dalam arsip ZIP. Microsoft Word menolak membuka berkas
        // ("Word experienced an error trying to open the file") bila tidak.
        // Karena itu [Content_Types].xml ditulis paling awal; media menyusul setelahnya.
        zip.file('[Content_Types].xml', contentTypesXml);
        zip.file('_rels/.rels', relsXml);
        zip.file('docProps/core.xml', coreXml);
        zip.file('docProps/app.xml', appXml);
        zip.file('word/document.xml', docXml);
        zip.file('word/styles.xml', stylesXml);
        zip.file('word/numbering.xml', numberingXml);
        zip.file('word/header1.xml', headerXml);
        zip.file('word/footer1.xml', footerXml);
        zip.file('word/_rels/document.xml.rels', wordRelsXml);
        for (const media of mediaFiles) {
            zip.file(`word/media/${media.fileName}`, media.buffer);
        }

        const outputType = (typeof Blob !== 'undefined') ? 'blob' : 'uint8array';
        const blob = await zip.generateAsync({ type: outputType });
        return blob;
    }

    /**
     * Menyimpan blob ke file dengan dukungan Native WKWebView Bridge atau browser download
     */
        const nativeDocumentSaveCallbacks = new Map();
        const rootWindow = typeof window !== 'undefined' ? window : globalThis;

        function triggerBrowserDownload(filename, blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            requestAnimationFrame(() => {
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 1000);
            });
            return { saved: true, fallback: true };
        }

        function nativeDocumentSaveAvailable() {
            return Boolean(rootWindow.webkit?.messageHandlers?.saveDocument);
        }

        function sendDocumentToNativeSaveDialog(filename, blob) {
            const fileBlob = blob instanceof Blob ? blob : new Blob([blob]);
            const requestID = globalThis.crypto?.randomUUID?.() ||
                `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;

            return new Promise((resolve, reject) => {
                let timeoutId;
                const finish = (fn) => {
                    const callback = nativeDocumentSaveCallbacks.get(requestID);
                    if (callback) {
                        nativeDocumentSaveCallbacks.delete(requestID);
                    }
                    clearTimeout(timeoutId);
                    fn();
                };

                const pendingCallback = { resolve, reject, timeoutId: null };
                nativeDocumentSaveCallbacks.set(requestID, pendingCallback);
                const reader = globalThis.FileReader ? new FileReader() : null;
                if (!reader) {
                    finish(() => reject(new Error('Browser tidak mendukung pembacaan file untuk dialog simpan native.')));
                    return;
                }

                reader.onload = () => {
                    try {
                        const dataUrl = String(reader.result || '');
                        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/i);
                        if (!match) {
                            clearTimeout(timeoutId);
                            finish(() => reject(new Error('Data file tidak valid untuk dialog simpan native.')));
                            return;
                        }
                        rootWindow.webkit.messageHandlers.saveDocument.postMessage({
                            requestID,
                            filename,
                            mimeType: match[1],
                            base64: match[2]
                        });
                        timeoutId = setTimeout(() => {
                            finish(() => reject(new Error(
                                'Dialog simpan native tidak merespons. Tutup dialog yang mungkin terbuka lalu coba lagi.'
                            )));
                        }, 120000);
                        pendingCallback.timeoutId = timeoutId;
                    } catch (error) {
                        clearTimeout(timeoutId);
                        finish(() => reject(error));
                    }
                };
                reader.onerror = () => {
                    finish(() => reject(new Error('Tidak dapat membaca data dokumen untuk dialog simpan native.')));
                };
                reader.readAsDataURL(fileBlob);
            });
        }

        globalThis.__nativeDocumentSaveComplete = (requestID, status, message) => {
            const callback = nativeDocumentSaveCallbacks.get(requestID);
            if (!callback) return;
            nativeDocumentSaveCallbacks.delete(requestID);
            callback.timeoutId && clearTimeout(callback.timeoutId);
            if (status === 'saved') callback.resolve({ saved: true });
            else if (status === 'cancelled') callback.resolve({ saved: false, cancelled: true });
            else callback.reject(new Error(message || 'Gagal menyimpan file dokumen.'));
        };

        async function saveDocumentBlob(filename, blob) {
            if (typeof window === 'undefined' || !window.document) {
                return { saved: true, data: blob };
            }

            if (filename.endsWith('.png') && typeof window.savePngBlob === 'function') {
                return window.savePngBlob(filename, blob);
            }

            if (nativeDocumentSaveAvailable()) {
                return sendDocumentToNativeSaveDialog(filename, blob);
            }

            if (typeof saveAs === 'function') {
                saveAs(blob, filename);
                return { saved: true };
            }

            return triggerBrowserDownload(filename, blob);
        }

    /**
     * API Publik Ekspor Universal
     */
    async function exportToPdf(options = {}) {
        const snapshot = await extractConversationSnapshot(options.container, options);
        const filename = options.filename || `Riwayat_EduVis_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.pdf`;
        return printToPdf(snapshot, { ...options, filename });
    }

    async function exportToDocx(options = {}) {
        const snapshot = await extractConversationSnapshot(options.container, options);
        const blob = await generateDocxBlob(snapshot, options);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = options.filename || `Riwayat_EduVis_${timestamp}.docx`;
        return saveDocumentBlob(filename, blob);
    }

    /**
     * Komponen Toast Mengambang Standar Universal
     */
    function showToast(msg, type = 'info') {
        if (typeof window === 'undefined' || !window.document || !document.body) return;
        let toast = document.getElementById('gemma-global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'gemma-global-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '24px';
            toast.style.right = '24px';
            toast.style.zIndex = '99999';
            toast.style.padding = '10px 18px';
            toast.style.borderRadius = '12px';
            toast.style.fontSize = '12px';
            toast.style.fontWeight = '500';
            toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.4)';
            toast.style.backdropFilter = 'blur(12px)';
            toast.style.webkitBackdropFilter = 'blur(12px)';
            toast.style.display = 'flex';
            toast.style.alignItems = 'center';
            toast.style.gap = '8px';
            toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px) scale(0.96)';
            toast.style.pointerEvents = 'none';
            document.body.appendChild(toast);
        }
        const isSuccess = type === 'success' || type === 'ok';
        const isError = type === 'error' || type === 'err';
        toast.style.background = isError ? 'rgba(239, 68, 68, 0.95)' : (isSuccess ? 'rgba(16, 185, 129, 0.95)' : 'rgba(30, 41, 59, 0.95)');
        toast.style.color = '#ffffff';
        toast.style.border = isError ? '1px solid rgba(248, 113, 113, 0.4)' : (isSuccess ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(148, 163, 184, 0.3)');
        const icon = isError ? '⚠️' : (isSuccess ? '✅' : 'ℹ️');
        toast.innerHTML = `<span>${icon}</span><span>${escapeHTML(msg)}</span>`;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0) scale(1)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px) scale(0.96)';
        }, 2800);
    }

    const api = {
        extractConversationSnapshot,
        generateCleanHtmlDoc,
        generateDocxBlob,
        printToPdf,
        exportToPdf,
        exportToDocx,
        saveDocumentBlob,
        showToast
    };

    global.GemmaExport = api;
    global.saveDocumentBlob = saveDocumentBlob;
    if (typeof global !== 'undefined' && !global.showToast) {
        global.showToast = showToast;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
