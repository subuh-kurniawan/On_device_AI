(() => {
    function normalizeChartConstructor() {
        if (typeof window.Chart !== 'function' || window.Chart.__aiConfigNormalized) return;
        const ChartConstructor = window.Chart;
        const NormalizedChart = new Proxy(ChartConstructor, {
            construct(target, args, newTarget) {
                const [context, config, ...rest] = args;
                const normalized = typeof window.normalizeAIChartConfig === 'function'
                    ? window.normalizeAIChartConfig(config) || config
                    : config;
                return Reflect.construct(target, [context, normalized, ...rest], newTarget);
            }
        });
        Object.defineProperty(NormalizedChart, '__aiConfigNormalized', { value: true });
        window.Chart = NormalizedChart;
    }

    function normalizeDiagramRenderers() {
        if (window.GemmaMermaid && typeof window.mermaid?.render === 'function' &&
            !window.mermaid.render.__aiInputNormalized) {
            const originalRender = window.mermaid.render.bind(window.mermaid);
            const normalizedRender = (id, source, ...args) => originalRender(
                id,
                window.GemmaMermaid.normalize(source),
                ...args
            );
            Object.defineProperty(normalizedRender, '__aiInputNormalized', { value: true });
            window.mermaid.render = normalizedRender;
        }

        const Transformer = window.markmap?.Transformer;
        if (window.GemmaMermaid && typeof Transformer === 'function' &&
            typeof Transformer.prototype.transform === 'function' &&
            !Transformer.prototype.transform.__aiInputNormalized) {
            const originalTransform = Transformer.prototype.transform;
            const normalizedTransform = function (source, ...args) {
                const normalizedSource = typeof source === 'string'
                    ? window.GemmaMermaid.normalizeMindmap(source)
                    : source;
                return originalTransform.call(this, normalizedSource, ...args);
            };
            Object.defineProperty(normalizedTransform, '__aiInputNormalized', { value: true });
            Transformer.prototype.transform = normalizedTransform;
        }
    }

    function enhance(root = document) {
        normalizeChartConstructor();
        normalizeDiagramRenderers();
        if (typeof window.renderMathInElement === 'function') {
            root.querySelectorAll?.('.ai-render-math').forEach(element => {
                if (element.dataset.mathRendered === 'true') return;
                window.renderMathInElement(element);
                element.dataset.mathRendered = 'true';
            });
        }
    }

    function start() {
        enhance();
        new MutationObserver(records => {
            for (const record of records) {
                record.addedNodes.forEach(node => {
                    if (node instanceof Element) enhance(node);
                });
            }
        }).observe(document.body, { childList: true, subtree: true });
        window.addEventListener('load', enhance, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
