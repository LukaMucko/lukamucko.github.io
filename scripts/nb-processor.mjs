import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notebooksDir = path.join(__dirname, '../src/notebooks');
const blogDir = path.join(__dirname, '../src/pages/blog');
const publicNbAssetsDir = path.join(__dirname, '../public/nb-assets');
const cachePath = path.join(__dirname, '.nb-cache.json');
const CACHE_VERSION = '4';

if (!fs.existsSync(publicNbAssetsDir)) fs.mkdirSync(publicNbAssetsDir, { recursive: true });
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

let cache = {};
if (fs.existsSync(cachePath)) {
    try {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch (e) { }
}

function saveCache() {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

function getHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

function normalizeSource(source) {
    return Array.isArray(source) ? source.join('') : (source || '');
}

function escapeTemplateLiteral(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
}

function buildIframeHtml(bodyContent, extraHead = '', extraScript = '') {
    const resizeScript = `
<script>
(() => {
    const send = () => {
        const height = document.documentElement.scrollHeight;
        const id = window.frameElement && window.frameElement.id;
        if (parent) parent.postMessage({ type: 'nb-iframe-height', id, height }, '*');
    };
    window.__nbSendHeight = send;
    const onReady = () => {
        send();
        if (window.ResizeObserver) {
            new ResizeObserver(send).observe(document.body);
        } else {
            setInterval(send, 1000);
        }
    };
    window.addEventListener('load', onReady);
})();
</script>`;

    return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{margin:0;padding:0;background:transparent;}</style>${extraHead}</head><body>${bodyContent}${extraScript}${resizeScript}</body></html>`;
}

function processNotebook(filename) {
    if (!filename.endsWith('.ipynb')) return;

    const filePath = path.join(notebooksDir, filename);
    if (!fs.existsSync(filePath)) return;

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const currentHash = getHash(rawData);

    const cacheKey = `${CACHE_VERSION}:${currentHash}`;
    if (cache[filename] === cacheKey) return;

    console.log(`Processing: ${filename}`);

    try {
        const notebook = JSON.parse(rawData);
        const slug = filename.replace('.ipynb', '');
        const assetsDir = path.join(publicNbAssetsDir, slug);
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        let mdxContent = "";
        let frontmatter = "";

        let cells = notebook.cells;
        const firstCellSource = normalizeSource(notebook.cells[0]?.source).trim();

        if (firstCellSource.startsWith('---')) {
            frontmatter = firstCellSource + "\n";
            cells = notebook.cells.slice(1);
        } else {
            frontmatter = `---\nlayout: ../../layouts/MarkdownPostLayout.astro\ntitle: '${slug}'\npubDate: '${new Date().toISOString().split('T')[0]}'\ndescription: 'Converted notebook'\nauthor: 'Notebook'\n---\n`;
        }

        mdxContent += frontmatter + "\n";

        cells.forEach((cell, index) => {
            const source = normalizeSource(cell.source);

            if (cell.cell_type === 'markdown') {
                if (source.trim()) mdxContent += source + "\n\n";
            } else if (cell.cell_type === 'code') {
                if (source.trim()) mdxContent += "```python\n" + source.trim() + "\n```\n\n";

                if (cell.outputs) {
                    cell.outputs.forEach((output, outIndex) => {
                        const hash = crypto.createHash('md5').update(`${slug}-${index}-${outIndex}-${JSON.stringify(output)}`).digest('hex').substring(0, 8);
                        const frameId = `nb-frame-${hash}`;

                        if (output.data && output.data['application/vnd.plotly.v1+json']) {
                            const assetName = `${hash}.html`;
                            const assetPath = path.join(assetsDir, assetName);
                            const plotlyData = output.data['application/vnd.plotly.v1+json'];
                            const plotlyHead = '<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>';
                            const plotlyBody = '<div id="plot" style="width:100%;height:100%;"></div>';
                            const plotlyScript = `<script>var d=${JSON.stringify(plotlyData)};Plotly.newPlot('plot', d.data, d.layout, {responsive: true}).then(function(){ if (window.__nbSendHeight) window.__nbSendHeight(); });</script>`;
                            const fullHtml = buildIframeHtml(plotlyBody, plotlyHead, plotlyScript);
                            fs.writeFileSync(assetPath, fullHtml);
                            mdxContent += `<iframe id="${frameId}" src="/nb-assets/${slug}/${assetName}" class="nb-output-frame" title="Notebook output ${index}-${outIndex}" loading="lazy"></iframe>\n\n`;
                        } else if (output.data && output.data['text/html']) {
                            const htmlContent = normalizeSource(output.data['text/html']);
                            const assetName = `${hash}.html`;
                            const assetPath = path.join(assetsDir, assetName);
                            const fullHtml = buildIframeHtml(htmlContent);
                            fs.writeFileSync(assetPath, fullHtml);

                            mdxContent += `<iframe id="${frameId}" src="/nb-assets/${slug}/${assetName}" class="nb-output-frame" title="Notebook output ${index}-${outIndex}" loading="lazy"></iframe>\n\n`;
                        } else if (output.data && (output.data['image/png'] || output.data['image/jpeg'])) {
                            const isPng = !!output.data['image/png'];
                            const imgData = isPng ? output.data['image/png'] : output.data['image/jpeg'];
                            const ext = isPng ? 'png' : 'jpg';
                            const assetName = `${hash}.${ext}`;
                            const assetPath = path.join(assetsDir, assetName);
                            fs.writeFileSync(assetPath, Buffer.from(imgData, 'base64'));
                            mdxContent += `<img class="nb-output-image" src="/nb-assets/${slug}/${assetName}" alt="Notebook output"/>\n\n`;
                        } else if (output.data && output.data['image/svg+xml']) {
                            const svgData = normalizeSource(output.data['image/svg+xml']);
                            const assetName = `${hash}.svg`;
                            const assetPath = path.join(assetsDir, assetName);
                            fs.writeFileSync(assetPath, svgData, 'utf8');
                            mdxContent += `<img class="nb-output-image" src="/nb-assets/${slug}/${assetName}" alt="Notebook output"/>\n\n`;
                        } else if (output.data && output.data['text/plain']) {
                            const textOut = normalizeSource(output.data['text/plain']);
                            if (textOut.trim()) {
                                const safe = escapeTemplateLiteral(textOut);
                                mdxContent += '<pre className="nb-output-text">{`' + safe + '`}</pre>\n\n';
                            }
                        } else if (output.text) {
                            const textOut = normalizeSource(output.text);
                            if (textOut.trim()) {
                                const safe = escapeTemplateLiteral(textOut);
                                mdxContent += '<pre className="nb-output-text">{`' + safe + '`}</pre>\n\n';
                            }
                        }
                    });
                }
            }
        });

        const mdxPath = path.join(blogDir, `${slug}.mdx`);
        fs.writeFileSync(mdxPath, mdxContent);

        cache[filename] = cacheKey;
        saveCache();
        console.log(`Converted ${filename} -> ${slug}.mdx`);
    } catch (err) {
        console.error(`Error processing ${filename}:`, err);
    }
}

if (fs.existsSync(notebooksDir)) {
    const files = fs.readdirSync(notebooksDir);
    files.forEach(processNotebook);
}

if (process.argv.includes('--watch')) {
    console.log("Watching notebooks...");
    fs.watch(notebooksDir, (eventType, filename) => {
        if (filename && filename.endsWith('.ipynb')) {
            if (fs.existsSync(path.join(notebooksDir, filename))) {
                processNotebook(filename);
            }
        }
    });
}
