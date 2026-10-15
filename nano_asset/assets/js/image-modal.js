(() => {
    const modalId = 'shared-image-modal';
    let previousOverflow = '';
    let previouslyFocused = null;

    function getModal() {
        let modal = document.getElementById(modalId);
        if (modal) return modal;

        const style = document.createElement('style');
        style.textContent = `
            #${modalId} {
                position: fixed;
                z-index: 10000;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: clamp(1rem, 4vw, 3rem);
                background: rgba(8, 10, 16, 0.84);
                -webkit-backdrop-filter: blur(12px);
                backdrop-filter: blur(12px);
            }
            #${modalId}[hidden] { display: none; }
            #${modalId} .image-modal-image[hidden],
            #${modalId} .attachment-modal-document[hidden] { display: none; }
            #${modalId} .image-modal-frame {
                display: flex;
                width: min(100%, 1200px);
                max-height: 100%;
                flex-direction: column;
                align-items: stretch;
                gap: .75rem;
            }
            #${modalId} .image-modal-toolbar {
                display: flex;
                min-height: 2.75rem;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                color: #f8fafc;
                font: 500 .875rem/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            #${modalId} .image-modal-caption {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            #${modalId} .image-modal-close {
                display: inline-flex;
                width: 2.75rem;
                height: 2.75rem;
                flex: 0 0 auto;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(255, 255, 255, .24);
                border-radius: 999px;
                background: rgba(255, 255, 255, .12);
                color: #fff;
                font: 400 1.5rem/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                cursor: pointer;
            }
            #${modalId} .image-modal-close:hover { background: rgba(255, 255, 255, .22); }
            #${modalId} .image-modal-image {
                display: block;
                width: auto;
                height: auto;
                max-width: 100%;
                max-height: calc(100vh - 7rem);
                align-self: center;
                object-fit: contain;
                border-radius: .75rem;
                box-shadow: 0 24px 80px rgba(0, 0, 0, .5);
            }
            #${modalId} .attachment-modal-document {
                display: block;
                width: 100%;
                max-height: calc(100vh - 7rem);
                overflow: auto;
                padding: clamp(1rem, 3vw, 2rem);
                border: 1px solid rgba(255, 255, 255, .16);
                border-radius: .75rem;
                background: #111827;
                color: #e2e8f0;
                font: 400 .875rem/1.65 ui-monospace, SFMono-Regular, Menlo, monospace;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                box-shadow: 0 24px 80px rgba(0, 0, 0, .5);
            }
        `;
        document.head.append(style);

        modal = document.createElement('div');
        modal.id = modalId;
        modal.hidden = true;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Pratinjau gambar');
        modal.innerHTML = `
            <div class="image-modal-frame">
                <div class="image-modal-toolbar">
                    <span class="image-modal-caption"></span>
                    <button type="button" class="image-modal-close" aria-label="Tutup pratinjau gambar">&times;</button>
                </div>
                <img class="image-modal-image" alt="" hidden>
                <pre class="attachment-modal-document" hidden></pre>
            </div>`;
        document.body.append(modal);
        modal.querySelector('.image-modal-close').addEventListener('click', closeImageModal);
        modal.addEventListener('click', event => {
            if (event.target === modal) closeImageModal();
        });
        return modal;
    }

    function openImageModal(imageOrSource, altText = '') {
        const sourceImage = imageOrSource instanceof HTMLImageElement ? imageOrSource : null;
        const src = sourceImage ? (sourceImage.currentSrc || sourceImage.src) : String(imageOrSource || '');
        if (!src) return;

        const modal = getModal();
        const image = modal.querySelector('.image-modal-image');
        const documentPreview = modal.querySelector('.attachment-modal-document');
        const caption = modal.querySelector('.image-modal-caption');
        const alt = sourceImage?.alt || altText || '';
        image.src = src;
        image.alt = alt;
        image.hidden = false;
        documentPreview.hidden = true;
        caption.textContent = alt;
        modal.setAttribute('aria-label', alt ? `Pratinjau gambar: ${alt}` : 'Pratinjau gambar');
        previouslyFocused = document.activeElement;
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        modal.hidden = false;
        modal.querySelector('.image-modal-close').focus();
    }

    function openAttachmentModal(attachment) {
        if (!attachment || typeof attachment !== 'object') return;
        if (attachment.type === 'image' && (attachment.data || attachment.raw)) {
            openImageModal(attachment.data || attachment.raw, attachment.name || 'Pratinjau gambar');
            return;
        }

        const modal = getModal();
        const image = modal.querySelector('.image-modal-image');
        const documentPreview = modal.querySelector('.attachment-modal-document');
        const name = String(attachment.name || 'Lampiran');
        const content = attachment.content ?? attachment.raw ?? '';
        image.hidden = true;
        image.removeAttribute('src');
        documentPreview.hidden = false;
        documentPreview.textContent = String(content) || 'Isi pratinjau tidak tersedia di riwayat ini.';
        modal.querySelector('.image-modal-caption').textContent = `${name} · Pratinjau isi`;
        modal.setAttribute('aria-label', `Pratinjau lampiran: ${name}`);
        previouslyFocused = document.activeElement;
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        modal.hidden = false;
        modal.querySelector('.image-modal-close').focus();
    }

    function closeImageModal() {
        const modal = document.getElementById(modalId);
        if (!modal || modal.hidden) return;
        modal.hidden = true;
        modal.querySelector('.image-modal-image').removeAttribute('src');
        document.body.style.overflow = previousOverflow;
        if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    }

    window.openImageModal = openImageModal;
    window.openAttachmentModal = openAttachmentModal;
    window.closeImageModal = closeImageModal;
    window.bindAttachmentPreview = (element, attachment) => {
        if (!element || !attachment) return;
        if (element.dataset.attachmentPreviewBound === 'true') {
            element.__attachmentPreview = attachment;
            return;
        }
        element.dataset.attachmentPreviewBound = 'true';
        element.__attachmentPreview = attachment;
        element.addEventListener('click', event => {
            if (event.target.closest('button')) return;
            openAttachmentModal(element.__attachmentPreview);
        });
    };

    document.addEventListener('click', event => {
        const image = event.target.closest?.('img');
        if (!image || image.closest(`#${modalId}`) || image.dataset.imageModal === 'false') return;
        const src = image.currentSrc || image.src;
        if (!src) return;
        event.preventDefault();
        event.stopPropagation();
        openImageModal(image);
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeImageModal();
    });
})();
