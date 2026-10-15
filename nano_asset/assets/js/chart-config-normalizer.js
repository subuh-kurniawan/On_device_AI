(function () {
    const chartTypeAliases = {
        column: 'bar',
        area: 'line',
    };

    window.normalizeAIChartConfig = function (config) {
        if (!config || typeof config !== 'object' || Array.isArray(config) ||
            typeof config.chart_type !== 'string' || !Array.isArray(config.data)) {
            return config;
        }

        const rows = config.data;
        if (!rows.length || !rows.every(row =>
            row &&
            typeof row === 'object' &&
            !Array.isArray(row) &&
            row.label !== undefined &&
            row.value !== undefined &&
            row.value !== null &&
            row.value !== '' &&
            Number.isFinite(Number(row.value))
        )) {
            return config;
        }

        const title = typeof config.title === 'string' ? config.title : '';
        const options = { ...(config.options || {}), responsive: true, maintainAspectRatio: false };
        options.plugins = {
            ...(options.plugins || {}),
            title: {
                ...(options.plugins?.title || {}),
                display: Boolean(title),
                text: title,
            },
        };

        const chartType = config.chart_type.trim().toLowerCase();
        return {
            type: chartTypeAliases[chartType] || chartType,
            data: {
                labels: rows.map(row => String(row.label)),
                datasets: [{
                    label: config.dataset_label || config.series_name || title || 'Nilai',
                    data: rows.map(row => Number(row.value)),
                }],
            },
            options,
        };
    };
})();
