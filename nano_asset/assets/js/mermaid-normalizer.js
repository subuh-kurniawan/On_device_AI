(function () {
    const diagramHeaderPattern = /^(?:flowchart|graph|mindmap|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|gitGraph|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|quadrantChart|xychart(?:-beta)?|sankey(?:-beta)?|block-beta|packet-beta|architecture-beta|kanban|timeline|radar-beta|treemap-beta)\b/i;

    function cleanLabel(label) {
        let value = String(label || '').trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        return value.replace(/"/g, "'");
    }

    function normalizeMindmapNodes(code) {
        const lines = code.split('\n');
        let changed = false;

        for (let index = 1; index < lines.length; index += 1) {
            const startIndex = index;
            const line = lines[index];
            const node = line.match(/^(\s*)([A-Za-z][A-Za-z0-9_.-]*)(?:\[|\{|\(\(|\()/);
            if (!node || node[2].toLowerCase() === 'root') continue;

            const indent = node[1];
            let source = line.slice(indent.length).trim();
            if (source.includes('[') && !source.includes(']')) {
                while (index + 1 < lines.length && !source.includes(']')) {
                    source += ` ${lines[++index].trim()}`;
                }
            }

            const shapedNode = source.match(
                /^[A-Za-z][A-Za-z0-9_.-]*(?:\[\s*([\s\S]*?)\s*\]|\{\s*([\s\S]*?)\s*\}|\(\(\s*([\s\S]*?)\s*\)\)|\(\s*([\s\S]*?)\s*\))$/
            );
            if (!shapedNode) continue;

            const label = shapedNode.slice(1).find(value => value !== undefined);
            lines.splice(
                startIndex,
                index - startIndex + 1,
                `${indent}${cleanLabel(label).replace(/\s+/g, ' ').trim()}`
            );
            index = startIndex;
            changed = true;
        }

        return changed ? lines.join('\n') : code;
    }

    function normalizeMindmapTree(source) {
        const code = normalizeMindmapNodes(source);
        const lines = code.split('\n');
        const headerIndex = lines.findIndex(line => /^\s*mindmap\b/i.test(line));
        if (headerIndex < 0) return code;

        let rootIndex = lines.findIndex((line, index) =>
            index > headerIndex && /^\s*root(?:\s*\(|\s*\[|\s*\{|\s*$)/i.test(line)
        );
        let inferredRoot = false;
        if (rootIndex < 0) {
            rootIndex = lines.findIndex((line, index) =>
                index > headerIndex && line.trim() && !/^\s*%%/.test(line)
            );
            inferredRoot = rootIndex >= 0;
            if (!inferredRoot) {
                rootIndex = headerIndex + 1;
                lines.splice(rootIndex, 0, '  root((Mindmap))');
            }
        }

        const rootLine = lines[rootIndex];
        const rootIndent = rootLine.match(/^\s*/)[0].length;
        const root = rootLine.match(
            /^\s*root\s*\(\(\s*([\s\S]*?)\s*\)\)\s*$|^\s*root\s*\[\s*([\s\S]*?)\s*\]\s*$|^\s*root\s*\{\s*([\s\S]*?)\s*\}\s*$|^\s*root\s+(.+?)\s*$/i
        );
        const rootLabel = root
            ? root.slice(1).find(value => value !== undefined)
            : inferredRoot
                ? rootLine.trim().replace(/^(?:[-*+]\s+|\d+[.)]\s+)/, '')
                : '';
        const shapedRoot = inferredRoot && rootLabel.match(
            /^(?:[A-Za-z][A-Za-z0-9_.-]*)(?:\[\s*([\s\S]*?)\s*\]|\{\s*([\s\S]*?)\s*\}|\(\(\s*([\s\S]*?)\s*\)\)|\(\s*([\s\S]*?)\s*\))$/
        );
        const normalizedRootLabel = shapedRoot
            ? shapedRoot.slice(1).find(value => value !== undefined) || ''
            : rootLabel;

        const safeRootLabel = cleanLabel(normalizedRootLabel || 'Mindmap');
        const rootShape = /[()]/.test(safeRootLabel)
            ? `["${safeRootLabel}"]`
            : `((${safeRootLabel}))`;
        lines[rootIndex] = `${' '.repeat(rootIndent)}root${rootShape}`;

        for (let index = rootIndex + 1; index < lines.length; index += 1) {
            const line = lines[index];
            if (!line.trim() || /^\s*%%/.test(line)) continue;

            const currentIndent = line.match(/^\s*/)[0].length;
            const indent = Math.max(rootIndent + 2, currentIndent);
            let label = line.trim();
            label = label.replace(/^(?:[-*+]\s+|\d+[.)]\s+)/, '');

            const shapedLabel = label.match(
                /^(?:[A-Za-z][A-Za-z0-9_.-]*)(?:\[\s*([\s\S]*?)\s*\]|\{\s*([\s\S]*?)\s*\}|\(\(\s*([\s\S]*?)\s*\)\)|\(\s*([\s\S]*?)\s*\))$/
            );
            if (shapedLabel) {
                label = shapedLabel.slice(1).find(value => value !== undefined) || '';
            }

            lines[index] = `${' '.repeat(indent)}["${cleanLabel(label)}"]`;
        }

        return lines.join('\n');
    }

    function normalizeMermaid(source) {
        let code = String(source || '')
            .replace(/\r/g, '')
            .replace(/^\s*```(?:mermaid|flowchart|mindmap)?\s*/gim, '')
            .replace(/```\s*$/gm, '')
            .trim();
        const header = code.match(/^\s*(?:flowchart|graph|mindmap|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|gitGraph|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|quadrantChart|xychart(?:-beta)?|sankey(?:-beta)?|block-beta|packet-beta|architecture-beta|kanban|timeline|radar-beta|treemap-beta)\b/im);
        if (header && header.index > 0) code = code.slice(header.index);
        if (/^\s*mindmap\b/i.test(code)) code = normalizeMindmapTree(code);
        if (!diagramHeaderPattern.test(code) &&
            /(?:-->|->|=>)/.test(code)) {
            code = `flowchart TD\n${code}`;
        }
        if (!/^\s*(?:flowchart|graph)\b/i.test(code)) return code;

        code = code.replace(
            /([\]\)}"'a-zA-Z0-9_])\s*(?:-->>|=>|->|>>)\s*(?=\||[A-Za-z0-9_])/g,
            '$1 --> '
        );

        return code.split('\n').map(line => {
            if (/^\s*(?:%%|style\b|classDef\b|class\b|linkStyle\b|subgraph\b|end\b|click\b)/i.test(line)) {
                return line;
            }

            const edgeLabels = [];
            line = line.replace(/-->\s*\|([^|\n]*)\|/g, (_, label) => {
                const placeholder = `__MERMAID_EDGE_LABEL_${edgeLabels.length}__`;
                edgeLabels.push(`-->|"${cleanLabel(label)}"|`);
                return placeholder;
            });
            line = line.replace(
                /\b([A-Za-z][A-Za-z0-9_]*)\s*\[(?!\[|\(|\/|\\)([^\[\]\n]*)\]/g,
                (match, id, label) => `${id}["${cleanLabel(label)}"]`
            );
            line = line.replace(
                /\b([A-Za-z][A-Za-z0-9_]*)\s*\{(?!\{)([^{}()\n]*)\}/g,
                (match, id, label) => `${id}{"${cleanLabel(label)}"}`
            );
            line = line.replace(/__MERMAID_EDGE_LABEL_(\d+)__/g, (match, index) => {
                return edgeLabels[Number(index)] || match;
            });
            line = line.replace(
                /(\b[A-Za-z][A-Za-z0-9_]*(?:\[[^\]\n]*\]|\{[^}\n]*\}|\([^)\n]*\))?)\s+--\s+([^>\n]+?)\s+-->\s*([A-Za-z][A-Za-z0-9_]*)/g,
                (_, from, label, to) => `${from} -->|"${cleanLabel(label)}"| ${to}`
            );
            return line;
        }).join('\n').trim();
    }

    function isDiagram(source) {
        const code = String(source || '')
            .replace(/\r/g, '')
            .replace(/^\s*```(?:mermaid|flowchart|mindmap)?\s*/gim, '')
            .replace(/```\s*$/gm, '')
            .trim();
        return code.split('\n').some(line => {
            const normalizedLine = line.trim().replace(/^%%.*(?:\n|$)/, '').trim();
            return diagramHeaderPattern.test(normalizedLine);
        });
    }

    function normalizeMindmap(source) {
        const code = String(source || '').replace(/\r/g, '').trim();
        if (/^\s*mindmap\b/i.test(code)) return normalizeMermaid(code);
        if (/^\s*(?:graph|flowchart)\b/i.test(code)) return normalizeMermaid(code);

        const items = [];
        for (const line of code.split('\n')) {
            const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
            const bullet = line.match(/^(\s*)[-*+]\s+(.+)$/);
            const numbered = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
            const item = heading
                ? { level: heading[1].length - 1, text: heading[2] }
                : bullet
                    ? { level: Math.floor(bullet[1].replace(/\t/g, '    ').length / 2) + 1, text: bullet[2] }
                    : numbered
                        ? { level: Math.floor(numbered[1].replace(/\t/g, '    ').length / 2) + 1, text: numbered[2] }
                        : null;
            if (item) {
                items.push({
                    level: item.level,
                    text: item.text
                        .replace(/`([^`]*)`/g, '$1')
                        .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, '$1$2')
                        .replace(/\*([^*]+)\*|_([^_]+)_/g, '$1$2')
                        .replace(/[\[\]{}()"]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim(),
                });
            } else if (!line.trim() && items.length) {
                continue;
            } else if (line.trim() && !items.length) {
                items.push({ level: 0, text: line.trim().replace(/[\[\]{}()"]/g, ' ') });
            }
        }

        const root = items.shift() || { text: 'Mindmap', level: 0 };
        const rootText = root.text.replace(/\s+/g, ' ').trim() || 'Mindmap';
        let output = `mindmap\n  root((${rootText}))`;
        let previousLevel = 0;
        for (const item of items) {
            const text = item.text.replace(/\s+/g, ' ').trim();
            if (!text) continue;
            const level = Math.max(1, Math.min(item.level, previousLevel + 1));
            output += `\n${'  '.repeat(level + 1)}${text}`;
            previousLevel = level;
        }
        return normalizeMermaid(output);
    }

    function normalizeFlowchart(source) {
        const code = String(source || '').replace(/\r/g, '').trim();
        if (/^\s*(?:flowchart|graph)\b/i.test(code)) return normalizeMermaid(code);

        const lines = code.split('\n');
        const declarations = new Map();
        const edges = [];
        for (const line of lines) {
            const declaration = line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*=>\s*([A-Za-z]+)\s*:\s*(.+?)\s*$/);
            if (declaration) {
                declarations.set(declaration[1], {
                    type: declaration[2].toLowerCase(),
                    label: declaration[3],
                });
                continue;
            }
            const edge = line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)(?:\((yes|no)\))?\s*->\s*([A-Za-z][A-Za-z0-9_]*)\s*$/i);
            if (edge) edges.push({ from: edge[1], label: edge[2], to: edge[3] });
        }
        if (declarations.size) {
            const nodes = [];
            for (const [id, declaration] of declarations) {
                const label = cleanLabel(declaration.label);
                const shape = declaration.type === 'start' ? `(("${label}"))`
                    : declaration.type === 'end' ? `(("${label}"))`
                        : declaration.type === 'condition' ? `{"${label}"}`
                            : `["${label}"]`;
                nodes.push(`${id}${shape}`);
            }
            for (const edge of edges) {
                nodes.push(edge.label
                    ? `${edge.from} -->|"${edge.label}"| ${edge.to}`
                    : `${edge.from} --> ${edge.to}`);
            }
            return normalizeMermaid(`flowchart TD\n${nodes.join('\n')}`);
        }

        const normalized = normalizeMermaid(code);
        return /^\s*(?:flowchart|graph|mindmap)\b/i.test(normalized)
            ? normalized
            : `flowchart TD\n${normalized}`;
    }

    window.GemmaMermaid = {
        normalize: normalizeMermaid,
        isDiagram,
        normalizeMindmap,
        normalizeFlowchart,
    };
})();
