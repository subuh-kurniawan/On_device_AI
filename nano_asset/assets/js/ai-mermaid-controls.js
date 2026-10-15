(function () {
    const stylesheetPath = 'nano_asset/assets/css/ai-renderers.css';
    const nativeSaveCallbacks = new Map();

    window.__nativeSvgSaveComplete = (requestID, status, message) => {
        const callback = nativeSaveCallbacks.get(requestID);
        if (!callback) return;
        nativeSaveCallbacks.delete(requestID);
        if (status === 'saved') callback.resolve({ saved: true });
        else if (status === 'cancelled') callback.resolve({ saved: false, cancelled: true });
        else callback.reject(new Error(message || 'Gagal menyimpan diagram SVG.'));
    };

    function saveSvg(filename, markup) {
        const messageHandler = window.webkit?.messageHandlers?.saveSvg;
        if (!messageHandler) {
            const url = URL.createObjectURL(new Blob([markup], {
                type: 'image/svg+xml;charset=utf-8'
            }));
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            return Promise.resolve({ saved: true });
        }

        const requestID = globalThis.crypto?.randomUUID?.() ||
            `svg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return new Promise((resolve, reject) => {
            nativeSaveCallbacks.set(requestID, { resolve, reject });
            try {
                messageHandler.postMessage({ requestID, filename, markup });
            } catch (error) {
                nativeSaveCallbacks.delete(requestID);
                reject(error);
            }
        });
    }
    window.saveSvgMarkup = saveSvg;

    let rendererStylesheet = [...document.querySelectorAll('link[rel="stylesheet"]')].find(link =>
        link.href.endsWith('/ai-renderers.css')
    );
    if (!rendererStylesheet) {
        rendererStylesheet = document.createElement('link');
        rendererStylesheet.rel = 'stylesheet';
        rendererStylesheet.href = stylesheetPath;
    }
    document.head.appendChild(rendererStylesheet);

    const toolbarMarkup = `
        <button type="button" title="Perbesar" aria-label="Perbesar diagram" class="mermaid-btn-zoom-in"><i class="bx bx-zoom-in"></i></button>
        <button type="button" title="Perkecil" aria-label="Perkecil diagram" class="mermaid-btn-zoom-out"><i class="bx bx-zoom-out"></i></button>
        <button type="button" title="Reset tampilan" aria-label="Reset zoom diagram" class="mermaid-btn-reset"><i class="bx bx-reset"></i></button>
        <span class="mermaid-toolbar-divider" aria-hidden="true"></span>
        <button type="button" title="Unduh SVG" aria-label="Unduh diagram sebagai SVG" class="mermaid-btn-svg"><i class="bx bx-code-alt"></i></button>
        <button type="button" title="Unduh PNG" aria-label="Unduh diagram sebagai PNG" class="mermaid-btn-png"><i class="bx bx-image-alt"></i></button>
        <span class="mermaid-toolbar-divider" aria-hidden="true"></span>
        <button type="button" title="Layar penuh" aria-label="Tampilkan diagram layar penuh" class="mermaid-btn-fullscreen"><i class="bx bx-fullscreen"></i></button>
    `;

    function getSvgString(diagram) {
        const svg = diagram.querySelector('svg');
        if (!svg) return null;
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        if (!clone.getAttribute('viewBox')) {
            const width = parseFloat(svg.getAttribute('width')) || svg.getBoundingClientRect().width;
            const height = parseFloat(svg.getAttribute('height')) || svg.getBoundingClientRect().height;
            clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        return { markup: new XMLSerializer().serializeToString(clone), svg };
    }

    function downloadBlob(blob, extension) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `diagram-${Date.now()}.${extension}`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function attachInteractions(wrapper, viewport, diagram, toolbar) {
        let scale = 1;
        let panX = 0;
        let panY = 0;
        let dragStart = null;

        const updateTransform = () => {
            diagram.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
        };
        const zoom = delta => {
            scale = Math.min(5, Math.max(0.5, scale + delta));
            updateTransform();
        };

        toolbar.querySelector('.mermaid-btn-zoom-in')?.addEventListener('click', () => zoom(0.2));
        toolbar.querySelector('.mermaid-btn-zoom-out')?.addEventListener('click', () => zoom(-0.2));
        toolbar.querySelector('.mermaid-btn-reset')?.addEventListener('click', () => {
            scale = 1;
            panX = 0;
            panY = 0;
            updateTransform();
        });

        viewport.addEventListener('pointerdown', event => {
            if (event.button !== 0 || event.target.closest('.mermaid-toolbar')) return;
            dragStart = { x: event.clientX - panX, y: event.clientY - panY };
            viewport.classList.add('is-panning');
            viewport.setPointerCapture(event.pointerId);
        });
        viewport.addEventListener('pointermove', event => {
            if (!dragStart) return;
            panX = event.clientX - dragStart.x;
            panY = event.clientY - dragStart.y;
            updateTransform();
        });
        const stopDragging = () => {
            dragStart = null;
            viewport.classList.remove('is-panning');
        };
        viewport.addEventListener('pointerup', stopDragging);
        viewport.addEventListener('pointercancel', stopDragging);
        viewport.addEventListener('wheel', event => {
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            zoom(event.deltaY < 0 ? 0.1 : -0.1);
        }, { passive: false });

        toolbar.querySelector('.mermaid-btn-svg')?.addEventListener('click', async () => {
            const result = getSvgString(diagram);
            if (!result) return;
            try {
                await saveSvg(`diagram-${Date.now()}.svg`, result.markup);
            } catch (error) {
                console.error('Gagal menyimpan diagram Mermaid sebagai SVG:', error);
            }
        });
        toolbar.querySelector('.mermaid-btn-png')?.addEventListener('click', () => {
            const result = getSvgString(diagram);
            if (!result) return;
            const viewBox = result.svg.viewBox?.baseVal;
            const width = viewBox?.width || result.svg.getBoundingClientRect().width || 800;
            const height = viewBox?.height || result.svg.getBoundingClientRect().height || 600;
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(width * 2);
                canvas.height = Math.ceil(height * 2);
                const context = canvas.getContext('2d');
                if (!context) {
                    console.error('Tidak dapat membuat canvas untuk ekspor Mermaid PNG.');
                    return;
                }
                context.fillStyle = getComputedStyle(wrapper).backgroundColor || '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async blob => {
                    if (!blob) {
                        console.error('Gagal membuat file PNG diagram Mermaid.');
                        return;
                    }
                    try {
                        if (typeof window.savePngBlob === 'function') {
                            await window.savePngBlob(`diagram-${Date.now()}.png`, blob);
                        } else {
                            downloadBlob(blob, 'png');
                        }
                    } catch (error) {
                        console.error('Gagal menyimpan PNG diagram Mermaid:', error);
                    }
                }, 'image/png');
            };
            image.onerror = error => console.error('Gagal memuat SVG untuk ekspor PNG Mermaid:', error);
            image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.markup)}`;
        });
        toolbar.querySelector('.mermaid-btn-fullscreen')?.addEventListener('click', async () => {
            try {
                if (document.fullscreenElement === wrapper) {
                    await document.exitFullscreen();
                } else {
                    await wrapper.requestFullscreen();
                }
            } catch (error) {
                console.error('Gagal mengubah mode layar penuh diagram Mermaid:', error);
            }
        });
        wrapper.addEventListener('fullscreenchange', () => {
            const button = toolbar.querySelector('.mermaid-btn-fullscreen');
            const isFullscreen = document.fullscreenElement === wrapper;
            button?.setAttribute('title', isFullscreen ? 'Keluar layar penuh' : 'Layar penuh');
            button?.setAttribute('aria-label', isFullscreen ? 'Keluar dari layar penuh' : 'Tampilkan diagram layar penuh');
            if (button) {
                button.innerHTML = `<i class="bx ${isFullscreen ? 'bx-exit-fullscreen' : 'bx-fullscreen'}"></i>`;
            }
        });
    }

    function enhanceWrapper(wrapper) {
        wrapper.classList.add('mermaid-controls');
        const viewport = wrapper.querySelector('.mermaid-svg-container') || wrapper;
        const diagram = wrapper.querySelector('.mermaid-content, .mermaid, .live-mermaid');
        if (!diagram) return;

        let toolbar = [...wrapper.children].find(child =>
            child.classList.contains('mermaid-toolbar') ||
            child.querySelector('.mermaid-btn-zoom-in')
        );
        const hasExistingToolbar = Boolean(toolbar);
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.className = 'mermaid-toolbar';
            toolbar.innerHTML = toolbarMarkup;
            wrapper.prepend(toolbar);
        } else {
            toolbar.classList.add('mermaid-toolbar');
        }
        if (wrapper.dataset.mermaidControlsReady === 'true') return;
        wrapper.dataset.mermaidControlsReady = 'true';

        if (!hasExistingToolbar && toolbar.querySelector('.mermaid-btn-zoom-in')) {
            toolbar.dataset.mermaidControlsBound = 'true';
            attachInteractions(wrapper, viewport, diagram, toolbar);
        }
    }

    function wrapDiagram(diagram) {
        if (diagram.closest('.mermaid-controls')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-wrapper mermaid-controls';
        const viewport = document.createElement('div');
        viewport.className = 'mermaid-svg-container';

        diagram.parentNode.insertBefore(wrapper, diagram);
        wrapper.appendChild(viewport);
        viewport.appendChild(diagram);
        diagram.classList.add('mermaid-content');
        diagram.style.transformOrigin = 'center center';
        diagram.style.transition = 'transform 0.1s ease-out';
        enhanceWrapper(wrapper);
    }

    function scan(root) {
        if (!(root instanceof Element || root instanceof Document)) return;
        if (root instanceof Element && root.matches('.mermaid-wrapper')) enhanceWrapper(root);
        root.querySelectorAll?.('.mermaid-wrapper').forEach(enhanceWrapper);

        const diagrams = [];
        if (root instanceof Element && root.matches('.mermaid:not(code), .live-mermaid')) diagrams.push(root);
        root.querySelectorAll?.('.mermaid:not(code), .live-mermaid').forEach(diagram => diagrams.push(diagram));
        diagrams.forEach(diagram => {
            if (!diagram.querySelector('svg') || diagram.closest('.mermaid-error-container')) return;
            wrapDiagram(diagram);
        });
    }

    function start() {
        scan(document);
        const observer = new MutationObserver(records => {
            records.forEach(record => {
                if (record.target instanceof Element) scan(record.target);
                record.addedNodes.forEach(node => {
                    if (!(node instanceof Element)) return;
                    scan(node);
                    const ancestor = node.closest('.mermaid-wrapper, .mermaid:not(code), .live-mermaid');
                    if (ancestor) scan(ancestor);
                });
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
