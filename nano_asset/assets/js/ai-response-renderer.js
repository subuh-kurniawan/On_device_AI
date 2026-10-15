(() => {
    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);

    function encodeSource(source) {
        return encodeURIComponent(source).replace(/'/g, '%27');
    }

    function replaceMath(source) {
        const formulas = [];
        const blockFormula = source.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, match => {
            const index = formulas.push({ source: match.replace(/^\$\$|^\s*\\\[|\\\]\s*$|\$\$$/g, ''), display: true }) - 1;
            return `AIMATHTOKEN${index}END`;
        });
        const withInlineMath = blockFormula.replace(/\\\(([\s\S]+?)\\\)|(^|[^$])\$([^$\n]+?)\$(?!\$)/g, (match, paren, prefix, inline) => {
            const formula = paren ?? inline;
            if (formula === undefined) return match;
            const index = formulas.push({ source: formula, display: false }) - 1;
            return `${prefix || ''}AIMATHTOKEN${index}END`;
        });
        return { source: withInlineMath, formulas };
    }

    function renderMarkdown(source) {
        if (!window.marked?.Renderer || typeof window.marked.parse !== 'function') {
            throw new Error('Markdown renderer marked.js tidak tersedia');
        }

        const renderer = new window.marked.Renderer();
        renderer.html = html => escapeHtml(typeof html === 'string' ? html : html?.text || '');
        renderer.code = (codeOrToken, language) => {
            const code = typeof codeOrToken === 'string' ? codeOrToken : codeOrToken?.text || '';
            const codeLanguage = typeof codeOrToken === 'string' ? language : codeOrToken?.lang;
            const kind = String(codeLanguage || '').trim().split(/\s+/)[0].toLowerCase();
            if (['chart', 'mermaid', 'flowchart', 'mindmap', 'markmap'].includes(kind)) {
                const rendererKind = kind === 'markmap' ? 'mindmap' : kind;
                return `<div class="ai-response-renderer" data-ai-renderer-kind="${rendererKind}" data-ai-renderer-source="${encodeSource(code)}"></div>`;
            }
            return `<pre><code class="language-${escapeHtml(kind)}">${escapeHtml(code)}</code></pre>`;
        };

        const math = replaceMath(source);
        let html = window.marked.parse(math.source, { renderer });
        math.formulas.forEach((formula, index) => {
            if (!window.katex?.renderToString) return;
            const rendered = window.katex.renderToString(formula.source, {
                displayMode: formula.display,
                throwOnError: false
            });
            html = html.replace(`AIMATHTOKEN${index}END`, rendered);
        });
        return html;
    }

    function sanitizeRenderedHtml(html) {
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        parsed.querySelectorAll('script, iframe, object, embed, form').forEach(element => element.remove());
        parsed.body.querySelectorAll('*').forEach(element => {
            for (const attribute of [...element.attributes]) {
                if (/^on/i.test(attribute.name)) {
                    element.removeAttribute(attribute.name);
                    continue;
                }
                if (['href', 'src', 'xlink:href', 'formaction'].includes(attribute.name.toLowerCase()) &&
                    /^\s*(?:javascript|vbscript|data):/i.test(attribute.value)) {
                    element.removeAttribute(attribute.name);
                }
            }
        });
        return parsed.body;
    }

    async function renderChart(container, source) {
        if (typeof window.Chart !== 'function') throw new Error('Chart.js tidak tersedia');
        const parsed = JSON.parse(source);
        const config = typeof window.normalizeAIChartConfig === 'function'
            ? window.normalizeAIChartConfig(parsed) || parsed
            : parsed;
        if (!config || typeof config !== 'object' || typeof config.type !== 'string' || !config.data) {
            throw new Error('Konfigurasi chart tidak valid');
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-container my-4';
        wrapper.style.cssText = 'position:relative;width:100%;height:350px';
        const canvas = document.createElement('canvas');
        canvas.className = 'ai-chart';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', config.options?.plugins?.title?.text || 'Grafik dari AI');
        wrapper.append(canvas);
        container.replaceWith(wrapper);
        new window.Chart(canvas.getContext('2d'), config);
    }

    async function renderMermaid(container, source, kind) {
        if (typeof window.mermaid?.render !== 'function') throw new Error('Mermaid tidak tersedia');
        const normalized = kind === 'flowchart'
            ? window.GemmaMermaid?.normalizeFlowchart(source) || source
            : window.GemmaMermaid?.normalize(source) || source;
        const result = await window.mermaid.render(`ai-diagram-${Date.now()}-${Math.random().toString(36).slice(2)}`, normalized);
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-wrapper mermaid-controls';
        const viewport = document.createElement('div');
        viewport.className = 'mermaid-svg-container';
        const diagram = document.createElement('div');
        diagram.className = 'mermaid-content mermaid';
        diagram.innerHTML = result.svg;
        viewport.append(diagram);
        wrapper.append(viewport);
        container.replaceWith(wrapper);
    }

    async function renderMindmap(container, source) {
        const Transformer = window.markmap?.Transformer;
        const Markmap = window.markmap?.Markmap;
        if (typeof Transformer !== 'function' || typeof Markmap?.create !== 'function') {
            throw new Error('Markmap tidak tersedia');
        }
        const { root } = new Transformer().transform(source);
        const wrapper = document.createElement('div');
        wrapper.className = 'markmap-wrapper my-4';
        wrapper.style.cssText = 'height:320px;min-height:260px;overflow:hidden';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        wrapper.append(svg);
        container.replaceWith(wrapper);
        Markmap.create(svg, { autoFit: true }, root);
    }

    async function renderAdvancedAIResponse(target, source) {
        if (!(target instanceof Element)) throw new TypeError('Target render tidak valid');
        const renderedBody = sanitizeRenderedHtml(renderMarkdown(String(source || '')));
        target.replaceChildren(...renderedBody.childNodes);

        target.querySelectorAll('table').forEach(table => {
            if (table.parentElement?.classList.contains('table-wrapper')) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            table.before(wrapper);
            wrapper.append(table);
        });

        for (const element of target.querySelectorAll('[data-ai-renderer-kind]')) {
            const kind = element.dataset.aiRendererKind;
            const code = decodeURIComponent(element.dataset.aiRendererSource || '');
            try {
                if (kind === 'chart') await renderChart(element, code);
                else if (kind === 'mindmap') await renderMindmap(element, code);
                else await renderMermaid(element, code, kind);
            } catch (error) {
                console.error(`Gagal merender ${kind}:`, error);
                element.className = 'ai-renderer-error';
                element.textContent = `Tidak dapat merender ${kind}: ${error.message}`;
                element.setAttribute('role', 'status');
            }
        }

        return target;
    }

    window.renderAdvancedAIResponse = renderAdvancedAIResponse;
})();
