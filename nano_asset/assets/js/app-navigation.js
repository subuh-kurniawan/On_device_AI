(() => {
    if (customElements.get('app-navigation')) return;

    const views = [
        { id: 'utama', label: 'Utama', href: './utama.html' },
        { id: 'vs', label: 'VS', href: './VS.html' },
        { id: 'claude', label: 'Claude', href: './obrolan-claude.html' },
        { id: 'utama-v2', label: 'Utama V2', href: './utamaV2.html' }
    ];
    let nextPanelId = 0;

    class AppNavigation extends HTMLElement {
        connectedCallback() {
            if (this.shadowRoot) return;

            const current = this.getAttribute('current')?.toLowerCase();
            if (!views.some(view => view.id === current)) {
                console.error('app-navigation requires a valid current view.');
                return;
            }

            const panelId = `app-navigation-panel-${++nextPanelId}`;
            this.setAttribute('current', current);
            this.setAttribute('theme', this.isLightTheme() ? 'light' : 'dark');
            const shadow = this.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
                <button class="toggle" type="button" aria-label="Buka aplikasi" title="Buka aplikasi"
                    aria-expanded="false" aria-controls="${panelId}">
                    <svg class="grid-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="4" y="4" width="6" height="6" rx="1"></rect>
                        <rect x="14" y="4" width="6" height="6" rx="1"></rect>
                        <rect x="4" y="14" width="6" height="6" rx="1"></rect>
                        <rect x="14" y="14" width="6" height="6" rx="1"></rect>
                    </svg>
                    <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m6 6 12 12M18 6 6 18"></path>
                    </svg>
                </button>
                <nav id="${panelId}" class="panel" aria-labelledby="${panelId}-title" aria-hidden="true" inert>
                    <h2 id="${panelId}-title" class="panel-title">Ruang AI</h2>
                    ${views.map(view => `
                        <a class="link" href="${view.href}"${view.id === current ? ' aria-current="page"' : ''}>
                            <span>${view.label}</span>
                            ${view.id === current ? '<span class="current-indicator" aria-hidden="true">Saat ini</span>' : ''}
                        </a>
                    `).join('')}
                </nav>
                <style>
                    *, *::before, *::after { box-sizing: border-box; }
                    :host {
                        --accent: #4285f4;
                        --accent-soft: rgba(66, 133, 244, 0.18);
                        position: fixed;
                        right: 1rem;
                        bottom: calc(11.5rem + env(safe-area-inset-bottom, 0px));
                        z-index: 40;
                        display: block;
                        color: #e2e8f0;
                        font: 500 0.875rem/1.4 system-ui, sans-serif;
                    }
                    :host([current="claude"]) {
                        --accent: #e6a28a;
                        --accent-soft: rgba(217, 119, 87, 0.16);
                    }
                    :host([current="utama-v2"]) {
                        --accent: #c4b5fd;
                        --accent-soft: rgba(155, 114, 248, 0.18);
                    }
                    .toggle {
                        display: grid;
                        width: 3.5rem;
                        height: 3.5rem;
                        place-items: center;
                        border: 1px solid rgba(255, 255, 255, 0.14);
                        border-radius: 9999px;
                        background: #171923;
                        color: var(--accent);
                        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32);
                        cursor: pointer;
                        transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease;
                    }
                    .toggle:hover {
                        transform: translateY(-2px);
                        border-color: var(--accent);
                        background: #202331;
                    }
                    .toggle:focus-visible, .link:focus-visible {
                        outline: 2px solid var(--accent);
                        outline-offset: 3px;
                    }
                    .toggle svg {
                        width: 1.25rem;
                        height: 1.25rem;
                        fill: none;
                        stroke: currentColor;
                        stroke-width: 1.8;
                    }
                    .close-icon { display: none; }
                    :host([open]) .grid-icon { display: none; }
                    :host([open]) .close-icon { display: block; }
                    .panel {
                        position: absolute;
                        right: 0;
                        bottom: calc(100% + 0.75rem);
                        display: grid;
                        width: min(17rem, calc(100vw - 2rem));
                        gap: 0.25rem;
                        padding: 0.375rem;
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        border-radius: 1rem;
                        background: rgba(17, 18, 24, 0.96);
                        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
                        opacity: 0;
                        visibility: hidden;
                        transform: translateY(0.5rem) scale(0.98);
                        transform-origin: bottom right;
                        transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease;
                    }
                    .panel-title {
                        margin: 0 0 0.125rem;
                        padding: 0.5rem 0.75rem 0.625rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        color: #94a3b8;
                        font-size: 0.7rem;
                        font-weight: 700;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                    }
                    :host([open]) .panel {
                        opacity: 1;
                        visibility: visible;
                        transform: translateY(0) scale(1);
                    }
                    .link {
                        display: flex;
                        min-height: 2.75rem;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.75rem;
                        border-radius: 0.7rem;
                        padding: 0.625rem 0.75rem;
                        color: #cbd5e1;
                        text-decoration: none;
                        transition: background-color 140ms ease, color 140ms ease;
                    }
                    .link:hover {
                        background: rgba(255, 255, 255, 0.07);
                        color: #fff;
                    }
                    .link[aria-current="page"] {
                        background: var(--accent-soft);
                        color: var(--accent);
                        font-weight: 700;
                    }
                    .current-indicator {
                        font-size: 0.65rem;
                        font-weight: 600;
                        opacity: 0.8;
                    }
                    :host([theme="light"]) {
                        color: #1e293b;
                    }
                    :host([theme="light"]) .toggle {
                        border-color: rgba(15, 23, 42, 0.12);
                        background: rgba(255, 255, 255, 0.96);
                        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
                    }
                    :host([theme="light"]) .toggle:hover {
                        background: #fff;
                    }
                    :host([theme="light"]) .panel {
                        border-color: #e2e7ef;
                        background: rgba(255, 255, 255, 0.98);
                        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
                    }
                    :host([theme="light"]) .panel-title {
                        border-bottom-color: rgba(15, 23, 42, 0.08);
                        color: #64748b;
                    }
                    :host([theme="light"]) .link {
                        color: #475569;
                    }
                    :host([theme="light"]) .link:hover {
                        background: #f1f5f9;
                        color: #0f172a;
                    }
                    :host([theme="light"]) .link[aria-current="page"] {
                        color: var(--accent);
                    }
                    @media (prefers-reduced-motion: reduce) {
                        *, *::before, *::after { transition-duration: 0.01ms !important; }
                    }
                </style>
            `;

            const toggle = shadow.querySelector('.toggle');
            const panel = shadow.querySelector('.panel');
            const setOpen = open => {
                this.toggleAttribute('open', open);
                toggle.setAttribute('aria-expanded', String(open));
                toggle.setAttribute('aria-label', open ? 'Tutup pilihan aplikasi' : 'Buka aplikasi');
                toggle.title = open ? 'Tutup pilihan aplikasi' : 'Buka aplikasi';
                panel.setAttribute('aria-hidden', String(!open));
                panel.inert = !open;
            };

            toggle.addEventListener('click', () => setOpen(!this.hasAttribute('open')));
            this.addEventListener('keydown', event => {
                if (event.key !== 'Escape' || !this.hasAttribute('open')) return;
                setOpen(false);
                toggle.focus();
            });
            document.addEventListener('pointerdown', event => {
                if (!event.composedPath().includes(this)) setOpen(false);
            });

            const syncTheme = () => {
                this.setAttribute('theme', this.isLightTheme() ? 'light' : 'dark');
            };
            new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            if (document.body) {
                new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] });
            }
        }

        isLightTheme() {
            return document.documentElement.classList.contains('light') ||
                document.body?.classList.contains('light-theme') === true;
        }
    }

    customElements.define('app-navigation', AppNavigation);
})();
