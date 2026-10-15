(() => {
    const colors = {
        unknown: { color: '#94a3b8', shadow: 'none', label: 'Status model belum diperiksa' },
        selected: { color: '#fbbf24', shadow: '0 0 8px rgba(251, 191, 36, .35)', label: 'Model dipilih; koneksi belum diuji' },
        unconfigured: { color: '#94a3b8', shadow: 'none', label: 'Belum ada model yang dipilih' },
        checking: { color: '#60a5fa', shadow: '0 0 8px rgba(96, 165, 250, .4)', label: 'Memeriksa koneksi model' },
        connected: { color: '#34d399', shadow: '0 0 8px rgba(52, 211, 153, .4)', label: 'API model terhubung' },
        unavailable: { color: '#f87171', shadow: '0 0 8px rgba(248, 113, 113, .35)', label: 'API atau model tidak tersedia' }
    };
    const labels = {
        unknown: 'Belum dicek',
        selected: 'Model dipilih',
        unconfigured: 'Pilih model',
        checking: 'Mengecek',
        connected: 'Terhubung',
        unavailable: 'Tidak tersedia'
    };

    function setModelStatus(state, detail = '') {
        const status = document.getElementById('status');
        if (!status) return;

        const appearance = colors[state] || colors.unconfigured;
        const label = detail ? `${appearance.label}: ${detail}` : appearance.label;
        status.dataset.state = state in colors ? state : 'unconfigured';
        status.style.backgroundColor = appearance.color;
        status.style.boxShadow = appearance.shadow;
        status.classList.remove('animate-pulse');
        status.title = label;
        status.setAttribute('role', 'status');
        status.setAttribute('aria-label', label);
        status.setAttribute('aria-live', 'polite');
        const visibleLabel = document.getElementById('model-status-label');
        if (visibleLabel) visibleLabel.textContent = labels[state] || labels.unconfigured;
    }

    function setModelSelection(model) {
        const status = document.getElementById('status');
        const selectedModel = String(model || '').trim();
        if (!status) return;
        if (['checking', 'connected', 'unavailable'].includes(status.dataset.state)) {
            status.dataset.model = selectedModel;
            return;
        }
        if (status.dataset.model === selectedModel && status.dataset.state) return;
        status.dataset.model = selectedModel;
        setModelStatus(selectedModel ? 'selected' : 'unconfigured', selectedModel);
    }

    window.setModelStatus = setModelStatus;
    window.setModelSelection = setModelSelection;

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('status')?.dataset.state) setModelStatus('unknown');
    });
})();
