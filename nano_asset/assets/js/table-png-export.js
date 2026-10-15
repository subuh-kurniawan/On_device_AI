(function () {
    const tableToolbarClass = 'ai-table-export-toolbar';
    const chartToolbarClass = 'ai-chart-export-toolbar';
    const nativeSaveCallbacks = new Map();

    window.__nativePngSaveComplete = (requestID, status, message) => {
        const callback = nativeSaveCallbacks.get(requestID);
        if (!callback) return;
        nativeSaveCallbacks.delete(requestID);
        if (status === 'saved') callback.resolve({ saved: true });
        else if (status === 'cancelled') callback.resolve({ saved: false, cancelled: true });
        else callback.reject(new Error(message || 'Gagal menyimpan file PNG.'));
    };

    function nativePngSaveAvailable() {
        return Boolean(window.webkit?.messageHandlers?.savePng);
    }

    function sendPngToNativeSaveDialog(filename, dataUrl) {
        const match = String(dataUrl).match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
        if (!match) return Promise.reject(new Error('Data PNG tidak valid untuk disimpan.'));

        const requestID = globalThis.crypto?.randomUUID?.() ||
            `png-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return new Promise((resolve, reject) => {
            nativeSaveCallbacks.set(requestID, { resolve, reject });
            try {
                window.webkit.messageHandlers.savePng.postMessage({
                    requestID,
                    filename,
                    base64: match[1],
                });
            } catch (error) {
                nativeSaveCallbacks.delete(requestID);
                reject(error);
            }
        });
    }

    function downloadPngInBrowser(filename, dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
        return Promise.resolve({ saved: true });
    }

    window.savePngDataUrl = (filename, dataUrl) => nativePngSaveAvailable()
        ? sendPngToNativeSaveDialog(filename, dataUrl)
        : downloadPngInBrowser(filename, dataUrl);

    window.savePngBlob = async (filename, blob) => {
        if (!nativePngSaveAvailable()) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            return { saved: true };
        }

        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Gagal membaca gambar PNG untuk dialog simpan.'));
            reader.readAsDataURL(blob);
        });
        return sendPngToNativeSaveDialog(filename, dataUrl);
    };

    function attachExportButton(wrapper) {
        if (wrapper.querySelector(`.${tableToolbarClass}`)) return;
        const table = wrapper.querySelector('table');
        if (!table) return;

        const toolbar = document.createElement('div');
        toolbar.className = tableToolbarClass;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ai-table-export-button';
        button.setAttribute('aria-label', 'Unduh tabel sebagai PNG');
        button.title = 'Unduh tabel sebagai PNG';
        button.innerHTML = '<i class="bx bx-image-alt" aria-hidden="true"></i><span>PNG</span>';
        button.addEventListener('click', () => downloadTableAsPng(button, table));
        toolbar.appendChild(button);
        wrapper.prepend(toolbar);
    }

    function attachChartExportButton(canvas) {
        const wrapper = canvas.parentElement;
        const messageBubble = canvas.closest('#messages .chat-bubble-ai');
        if (messageBubble) {
            messageBubble.classList.add('has-chart-output');
            messageBubble.closest('#messages .max-w-4xl')?.classList.add('has-chart-output-row');
        }
        if (!wrapper || wrapper.querySelector(`:scope > .${chartToolbarClass}`)) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = chartToolbarClass;
        button.setAttribute('aria-label', 'Unduh grafik sebagai PNG');
        button.title = 'Unduh grafik sebagai PNG';
        button.innerHTML = '<i class="bx bx-image-alt" aria-hidden="true"></i><span>PNG</span>';
        button.addEventListener('click', () => downloadChartAsPng(button, canvas));
        wrapper.appendChild(button);
    }

    async function downloadChartAsPng(button, canvas) {
        button.disabled = true;
        try {
            const chart = typeof window.Chart?.getChart === 'function'
                ? window.Chart.getChart(canvas)
                : null;
            if (!chart) throw new Error('Grafik belum selesai dirender.');

            const result = await window.savePngDataUrl(
                `grafik-${Date.now()}.png`,
                chart.toBase64Image('image/png', 1)
            );
            button.title = result.cancelled
                ? 'Penyimpanan PNG dibatalkan'
                : 'Grafik berhasil diunduh sebagai PNG';
            button.setAttribute('aria-label', button.title);
            button.innerHTML = result.cancelled
                ? '<i class="bx bx-x" aria-hidden="true"></i><span>Batal</span>'
                : '<i class="bx bx-check" aria-hidden="true"></i><span>OK</span>';
            window.setTimeout(() => {
                if (!button.isConnected) return;
                button.title = 'Unduh grafik sebagai PNG';
                button.setAttribute('aria-label', button.title);
                button.innerHTML = '<i class="bx bx-image-alt" aria-hidden="true"></i><span>PNG</span>';
            }, 2000);
        } catch (error) {
            console.error('Gagal mengunduh grafik sebagai PNG:', error);
            button.title = `Gagal mengunduh PNG: ${error.message || String(error)}`;
            button.setAttribute('aria-label', button.title);
        } finally {
            button.disabled = false;
        }
    }

    function loadHtml2Pdf() {
        if (typeof window.html2pdf === 'function') return Promise.resolve();
        if (window.__tablePngHtml2PdfPromise) return window.__tablePngHtml2PdfPromise;

        window.__tablePngHtml2PdfPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'nano_asset/assets/js/html2pdf.bundle.min.js';
            script.onload = () => typeof window.html2pdf === 'function'
                ? resolve()
                : reject(new Error('html2pdf.js termuat tanpa menyediakan API ekspor.'));
            script.onerror = () => reject(new Error('Pustaka ekspor PNG tabel gagal dimuat.'));
            document.head.appendChild(script);
        });
        return window.__tablePngHtml2PdfPromise;
    }

    async function downloadTableAsPng(button, table) {
        const originalContent = button.innerHTML;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.removeAttribute('title');

        try {
            await loadHtml2Pdf();
            const backgroundColor = getComputedStyle(table).backgroundColor || '#ffffff';
            const canvas = await window.html2pdf()
                .set({
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        backgroundColor,
                        logging: false,
                    },
                    margin: 0,
                })
                .from(table)
                .toCanvas()
                .get('canvas');
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(result => result
                    ? resolve(result)
                    : reject(new Error('Browser tidak dapat membuat berkas PNG.')), 'image/png');
            });
            const result = await window.savePngBlob(`tabel-${Date.now()}.png`, blob);
            button.innerHTML = result.cancelled
                ? '<i class="bx bx-x" aria-hidden="true"></i><span>Batal</span>'
                : '<i class="bx bx-check" aria-hidden="true"></i><span>Tersimpan</span>';
            button.title = result.cancelled
                ? 'Penyimpanan PNG dibatalkan'
                : 'Tabel berhasil diunduh sebagai PNG';
        } catch (error) {
            console.error('Gagal mengunduh tabel sebagai PNG:', error);
            button.innerHTML = '<i class="bx bx-error-circle" aria-hidden="true"></i><span>Gagal</span>';
            button.title = `Gagal mengunduh PNG: ${error.message || String(error)}`;
            button.setAttribute('aria-label', button.title);
        } finally {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            window.setTimeout(() => {
                if (!button.isConnected) return;
                button.innerHTML = originalContent;
                button.title = 'Unduh tabel sebagai PNG';
                button.setAttribute('aria-label', 'Unduh tabel sebagai PNG');
            }, 2500);
        }
    }

    function scan(root) {
        if (root instanceof Element && root.matches('.table-wrapper')) {
            attachExportButton(root);
        }
        root.querySelectorAll?.('.table-wrapper').forEach(attachExportButton);
        if (root instanceof Element && root.matches('canvas.ai-chart, .live-chart-canvas')) {
            attachChartExportButton(root);
        }
        root.querySelectorAll?.('canvas.ai-chart, .live-chart-canvas').forEach(attachChartExportButton);
    }

    function start() {
        scan(document);
        new MutationObserver(records => {
            records.forEach(record => {
                record.addedNodes.forEach(node => {
                    if (node instanceof Element) scan(node);
                });
            });
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
