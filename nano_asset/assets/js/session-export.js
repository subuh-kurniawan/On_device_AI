(function () {
    function exportSavedSession(session) {
        if (!session || !Array.isArray(session.messages)) {
            alert('Sesi tidak valid atau tidak memiliki pesan untuk diekspor.');
            return;
        }

        try {
            const exportData = { ...session };
            delete exportData.id;
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const safeName = (session.name || session.title || 'sesi')
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9_-]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 80) || 'sesi';

            link.href = url;
            link.download = `${safeName}.json`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Failed to export saved session:', error);
            alert(`Gagal mengekspor sesi: ${error.message}`);
        }
    }

    function exportAllSavedSessions(database) {
        if (!database) {
            alert('Penyimpanan sesi belum siap. Coba lagi setelah aplikasi selesai dimuat.');
            return;
        }

        let request;
        try {
            request = database.transaction('sessions', 'readonly').objectStore('sessions').getAll();
        } catch (error) {
            console.error('Failed to read saved sessions:', error);
            alert(`Gagal membaca sesi tersimpan: ${error.message}`);
            return;
        }

        request.onsuccess = () => {
            const sessions = request.result || [];
            if (sessions.length === 0) {
                alert('Belum ada sesi tersimpan untuk diekspor.');
                return;
            }

            if (sessions.some(session => !session || !Array.isArray(session.messages))) {
                alert('Ekspor dibatalkan karena ada sesi tersimpan yang tidak valid. Sesi yang tersimpan tidak diubah.');
                return;
            }

            const exportData = sessions.map(session => {
                const copy = { ...session };
                delete copy.id;
                return copy;
            });
            exportSavedSessionCollection(exportData);
        };

        request.onerror = () => {
            const error = request.error;
            console.error('Failed to read saved sessions:', error);
            alert(`Gagal membaca sesi tersimpan: ${error?.message || 'Kesalahan database.'}`);
        };
    }

    function exportSavedSessionCollection(sessions) {
        try {
            const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sesi-tersimpan-${new Date().toISOString().slice(0, 10)}.json`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Failed to export saved sessions:', error);
            alert(`Gagal mengekspor sesi: ${error.message}`);
        }
    }

    window.exportSavedSession = exportSavedSession;
    window.exportAllSavedSessions = exportAllSavedSessions;
})();
