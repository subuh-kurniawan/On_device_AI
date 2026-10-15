(function () {
    function normalizeImportedSession(session) {
        if (!session || typeof session !== 'object' || Array.isArray(session) || !Array.isArray(session.messages)) {
            return null;
        }

        const normalized = { ...session };
        normalized.id = typeof window.crypto?.randomUUID === 'function'
            ? window.crypto.randomUUID()
            : `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const title = typeof session.title === 'string' && session.title.trim()
            ? session.title.trim()
            : typeof session.name === 'string' && session.name.trim()
                ? session.name.trim()
                : 'Sesi impor';
        normalized.name = title;
        if (Object.hasOwn(session, 'title')) normalized.title = title;
        normalized.createdAt = Number.isFinite(session.createdAt)
            ? session.createdAt
            : Date.now();
        normalized.updatedAt = Number.isFinite(session.updatedAt)
            ? session.updatedAt
            : normalized.createdAt;
        normalized.messageCount = session.messages.length;
        return normalized;
    }

    function importSavedSessions(event, database, onImported) {
        const input = event?.target;
        const file = input?.files?.[0];
        if (!file) return;
        input.value = '';

        const reader = new FileReader();
        reader.onerror = () => {
            console.error('Failed to read session import file:', reader.error);
            alert(`Gagal membaca berkas sesi: ${reader.error?.message || 'Kesalahan pembacaan berkas.'}`);
        };

        reader.onload = () => {
            let sessions;
            try {
                const payload = JSON.parse(reader.result);
                sessions = Array.isArray(payload) ? payload : [payload];
            } catch (error) {
                alert(`Berkas JSON tidak valid: ${error.message}`);
                return;
            }

            const validSessions = sessions.map(normalizeImportedSession).filter(Boolean);
            const skipped = sessions.length - validSessions.length;
            if (validSessions.length === 0) {
                alert(`Tidak ada sesi valid untuk diimpor. ${skipped} entri dilewati; pastikan setiap sesi memiliki array messages.`);
                return;
            }

            let transaction;
            try {
                transaction = database.transaction('sessions', 'readwrite');
                const store = transaction.objectStore('sessions');
                for (const session of validSessions) store.add(session);
            } catch (error) {
                console.error('Failed to start session import:', error);
                alert(`Gagal memulai impor sesi: ${error.message}`);
                return;
            }

            transaction.oncomplete = () => {
                if (typeof onImported === 'function') onImported();
                const skippedMessage = skipped ? ` ${skipped} entri tidak valid dilewati.` : '';
                alert(`${validSessions.length} sesi berhasil diimpor.${skippedMessage}`);
            };

            transaction.onerror = () => {
                const error = transaction.error;
                console.error('Session import transaction failed:', error);
                alert(`Gagal mengimpor sesi: ${error?.message || 'Kesalahan database.'} Tidak ada sesi dari berkas ini yang disimpan.`);
            };

            transaction.onabort = () => {
                if (transaction.error) {
                    console.error('Session import transaction aborted:', transaction.error);
                }
            };
        };

        reader.readAsText(file);
    }

    window.importSavedSessions = importSavedSessions;
})();
