(function () {
    'use strict';

    const ALLOWED_PAGES = new Set(['index.html', 'utama.html', 'utamaV2.html', 'VS.html', 'obrolan-claude.html', 'percakapan-gemini-live.html']);

    function renderQr(container, value) {
        if (typeof window.qrcode !== 'function') {
            throw new Error('Generator QR lokal belum tersedia. Muat ulang aplikasi.');
        }
        const code = window.qrcode(0, 'M');
        code.addData(value);
        code.make();
        const size = code.getModuleCount();
        const namespace = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(namespace, 'svg');
        const quietZone = 4;
        const extent = size + quietZone * 2;
        svg.setAttribute('viewBox', `0 0 ${extent} ${extent}`);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', `QR code untuk ${value}`);
        svg.setAttribute('class', 'block w-full h-full');
        const background = document.createElementNS(namespace, 'rect');
        background.setAttribute('width', String(extent));
        background.setAttribute('height', String(extent));
        background.setAttribute('fill', '#fff');
        svg.append(background);

        let pathData = '';
        for (let row = 0; row < size; row += 1) {
            for (let column = 0; column < size; column += 1) {
                if (code.isDark(row, column)) pathData += `M${column + quietZone},${row + quietZone}h1v1h-1z`;
            }
        }
        const path = document.createElementNS(namespace, 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', '#111827');
        svg.append(path);
        container.replaceChildren(svg);
    }

    function createButton() {
        const header = document.querySelector('header');
        if (!header || document.getElementById('lan-qr-open')) return;
        const buttonGroup = [...header.children].reverse().find(element => element.classList.contains('flex')) || header;

        const button = document.createElement('button');
        button.id = 'lan-qr-open';
        button.type = 'button';
        button.className = 'min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white';
        button.setAttribute('aria-label', 'Tampilkan QR code untuk perangkat lain');
        button.title = 'Buka di perangkat lain';
        button.innerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/></svg><span class="hidden sm:inline text-xs">Perangkat lain</span>';
        button.addEventListener('click', openModal);
        buttonGroup.append(button);
    }

    function createModal() {
        if (document.getElementById('lan-qr-modal')) return;
        const overlay = document.createElement('div');
        overlay.id = 'lan-qr-modal';
        overlay.className = 'hidden fixed inset-0 z-[120] items-center justify-center bg-black/75 p-4 backdrop-blur-sm';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'lan-qr-title');
        overlay.innerHTML = `
            <section class="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#131314] p-5 text-slate-100 shadow-2xl sm:p-6">
                <div class="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h2 id="lan-qr-title" class="text-base font-bold">Buka di perangkat lain</h2>
                        <p class="mt-1 text-xs text-slate-400">Pindai QR code dari perangkat yang terhubung ke Wi-Fi yang sama.</p>
                    </div>
                    <button id="lan-qr-close" type="button" class="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Tutup modal">✕</button>
                </div>
                <div class="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div id="lan-qr-image" class="h-56 w-56 max-w-full rounded-lg bg-white p-2"></div>
                    <label class="w-full text-xs text-slate-400" for="lan-qr-address-select">
                        Alamat jaringan
                        <select id="lan-qr-address-select" class="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#1b1b1d] px-3 text-xs text-slate-200"></select>
                    </label>
                    <div class="flex w-full gap-2">
                        <button id="lan-qr-copy" type="button" class="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold hover:bg-white/10">Salin tautan</button>
                        <a id="lan-qr-ca" class="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 text-center text-xs font-semibold text-sky-300 hover:bg-sky-500/20" target="_blank" rel="noopener">Sertifikat perangkat</a>
                    </div>
                </div>
                <p id="lan-qr-status" class="mt-3 text-center text-xs text-slate-400" role="status" aria-live="polite">Mendeteksi alamat jaringan...</p>
                <p class="mt-3 text-[11px] leading-relaxed text-amber-200/80">Perangkat lain mungkin perlu mempercayai sertifikat lokal sebelum membuka halaman. Gunakan hanya di jaringan tepercaya.</p>
            </section>`;
        overlay.addEventListener('click', event => {
            if (event.target === overlay) closeModal();
        });
        overlay.querySelector('#lan-qr-close').addEventListener('click', closeModal);
        overlay.querySelector('#lan-qr-address-select').addEventListener('change', updateQr);
        overlay.querySelector('#lan-qr-copy').addEventListener('click', copyAddress);
        document.body.append(overlay);
    }

    let networkUrls = [];

    function selectedAddress() {
        const select = document.getElementById('lan-qr-address-select');
        const entry = networkUrls[Number(select.value)];
        return entry || null;
    }

    function updateQr() {
        const entry = selectedAddress();
        const image = document.getElementById('lan-qr-image');
        const status = document.getElementById('lan-qr-status');
        if (!entry) return;
        document.getElementById('lan-qr-ca').href = `https://${entry.address}:1234/api/lan-ca`;
        try {
            renderQr(image, entry.url);
            status.textContent = entry.url;
            status.className = 'mt-3 break-all text-center font-mono text-xs text-slate-300';
        } catch (error) {
            image.replaceChildren();
            status.textContent = error.message;
            status.className = 'mt-3 text-center text-xs text-amber-300';
        }
    }

    async function loadNetworkAddresses() {
        const select = document.getElementById('lan-qr-address-select');
        const status = document.getElementById('lan-qr-status');
        const image = document.getElementById('lan-qr-image');
        select.replaceChildren();
        image.replaceChildren();
        status.textContent = 'Mendeteksi alamat jaringan...';
        status.className = 'mt-3 text-center text-xs text-slate-400';

        try {
            const response = await fetch('/api/network-info', { cache: 'no-store' });
            if (!response.ok) throw new Error(`Server jaringan merespons HTTP ${response.status}.`);
            const networkInfo = await response.json();
            const currentPage = location.pathname.split('/').pop();
            if (!ALLOWED_PAGES.has(currentPage)) throw new Error('Halaman ini tidak tersedia untuk akses jaringan.');
            if (!Array.isArray(networkInfo.addresses)) throw new Error('Server tidak memberikan daftar alamat jaringan.');

            const model = new URLSearchParams(location.search).get('model');
            networkUrls = networkInfo.addresses
                .filter(address => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(address))
                .map(address => {
                    const url = new URL(`https://${address}:1234/index.html`);
                    if (model) url.searchParams.set('model', model);
                    return { address, url: url.href };
                });
            if (networkUrls.length === 0) throw new Error('Alamat Wi-Fi tidak terdeteksi. Pastikan perangkat ini terhubung ke jaringan lokal.');

            for (const [index, entry] of networkUrls.entries()) {
                const option = document.createElement('option');
                option.value = String(index);
                option.textContent = `https://${entry.address}:1234`;
                select.append(option);
            }
            updateQr();
        } catch (error) {
            networkUrls = [];
            status.textContent = error instanceof TypeError
                ? 'Tidak dapat mengambil alamat jaringan. Buka aplikasi melalui launcher lokal dan coba lagi.'
                : error.message;
            status.className = 'mt-3 text-center text-xs text-amber-300';
            select.disabled = true;
            image.replaceChildren();
        }
    }

    async function copyAddress() {
        const entry = selectedAddress();
        const status = document.getElementById('lan-qr-status');
        if (!entry) return;
        try {
            await navigator.clipboard.writeText(entry.url);
            status.textContent = 'Tautan berhasil disalin.';
            status.className = 'mt-3 text-center text-xs text-emerald-300';
        } catch (error) {
            status.textContent = `Gagal menyalin tautan: ${error.message}`;
            status.className = 'mt-3 text-center text-xs text-amber-300';
        }
    }

    function closeModal() {
        const modal = document.getElementById('lan-qr-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.removeEventListener('keydown', handleKeydown);
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') closeModal();
    }

    function openModal() {
        const modal = document.getElementById('lan-qr-modal');
        const select = document.getElementById('lan-qr-address-select');
        select.disabled = false;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.addEventListener('keydown', handleKeydown);
        document.getElementById('lan-qr-close').focus();
        loadNetworkAddresses();
    }

    document.addEventListener('DOMContentLoaded', () => {
        createModal();
        createButton();
    }, { once: true });
})();
