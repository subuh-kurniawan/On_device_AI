(function () {
    function getSessionSearchText(session) {
        const values = [session?.name || ''];
        const messages = Array.isArray(session?.messages) ? session.messages : [];
        let remaining = 20000;

        for (const message of messages.slice().reverse()) {
            if (!message || typeof message !== 'object' || remaining <= 0) continue;

            for (const key of ['content', 'text', 'prompt', 'message', 'fileName', 'filename']) {
                const value = message[key];
                if (typeof value !== 'string' || !value || value.startsWith('data:')) continue;

                const excerpt = value.slice(0, Math.min(1000, remaining));
                values.push(excerpt);
                remaining -= excerpt.length;
                if (remaining <= 0) break;
            }
        }

        return values.join(' ').toLocaleLowerCase();
    }

    function filterSessions(input) {
        const container = document.getElementById('sessions-list-container');
        if (!container) return;

        container.querySelectorAll(':scope > :not(#no-sessions-text):not(#saved-session-search-empty)')
            .forEach(item => {
                item.setAttribute('data-session-search-item', '');
                if (!item.dataset.searchText) item.dataset.searchText = item.textContent || '';
            });
        const query = input.value.trim().toLocaleLowerCase();
        const items = Array.from(container.querySelectorAll('[data-session-search-item]'));
        let visibleCount = 0;

        for (const item of items) {
            const matches = !query || (item.dataset.searchText || item.textContent)
                .toLocaleLowerCase()
                .includes(query);
            item.hidden = !matches;
            if (matches) visibleCount += 1;
        }

        let emptyMessage = document.getElementById('saved-session-search-empty');
        if (!emptyMessage) {
            emptyMessage = document.createElement('p');
            emptyMessage.id = 'saved-session-search-empty';
            emptyMessage.className = 'text-xs text-slate-400 text-center py-8';
            emptyMessage.setAttribute('role', 'status');
            container.appendChild(emptyMessage);
        }

        const showEmptyMessage = query && items.length > 0 && visibleCount === 0;
        emptyMessage.textContent = `Tidak ada sesi yang cocok dengan "${input.value.trim()}".`;
        emptyMessage.hidden = !showEmptyMessage;
    }

    function getSessionDatabase() {
        if (typeof db !== 'undefined') return db;
        return window.sessionDb || null;
    }

    function showSessionActionError(message) {
        console.error(message);
        window.alert(message);
    }

    function addSessionActions(searchWrap) {
        if (searchWrap.querySelector('[data-session-json-action]')) return;

        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-2 mt-2';
        const exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.textContent = 'Ekspor JSON';
        exportButton.dataset.sessionJsonAction = 'export';
        exportButton.className = 'rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10';
        exportButton.addEventListener('click', () => {
            const database = getSessionDatabase();
            if (!database || typeof window.exportAllSavedSessions !== 'function') {
                showSessionActionError('Database sesi atau fitur ekspor JSON tidak tersedia.');
                return;
            }
            window.exportAllSavedSessions(database);
        });

        const importButton = document.createElement('button');
        importButton.type = 'button';
        importButton.textContent = 'Impor JSON';
        importButton.dataset.sessionJsonAction = 'import';
        importButton.className = exportButton.className;
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/json,.json';
        fileInput.hidden = true;
        fileInput.setAttribute('aria-label', 'Pilih berkas sesi JSON');
        fileInput.addEventListener('change', event => {
            const database = getSessionDatabase();
            if (!database || typeof window.importSavedSessions !== 'function') {
                showSessionActionError('Database sesi atau fitur impor JSON tidak tersedia.');
                fileInput.value = '';
                return;
            }
            window.importSavedSessions(event, database, () => {
                window.openSessionManagementModal?.();
            });
        });
        importButton.addEventListener('click', () => fileInput.click());

        actions.append(exportButton, importButton, fileInput);
        searchWrap.append(actions);
    }

    window.getSavedSessionSearchText = getSessionSearchText;

    function initialize() {
        const container = document.getElementById('sessions-list-container');
        if (!container) return;
        let input = document.getElementById('saved-session-search');
        let searchWrap;
        if (!input) {
            searchWrap = document.createElement('div');
            searchWrap.className = 'px-6 pt-4';
            input = document.createElement('input');
            input.id = 'saved-session-search';
            input.type = 'search';
            input.placeholder = 'Cari sesi tersimpan...';
            input.setAttribute('aria-label', 'Cari sesi tersimpan');
            input.className = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-gemini-blue focus:outline-none';
            searchWrap.append(input);
            container.before(searchWrap);
        } else {
            searchWrap = input.closest('#saved-session-search-wrap') || input.parentElement;
        }
        if (searchWrap) addSessionActions(searchWrap);
        input.addEventListener('input', () => filterSessions(input));
        new MutationObserver(() => filterSessions(input)).observe(container, { childList: true });
        filterSessions(input);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
