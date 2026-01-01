import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notebooksDir = path.join(__dirname, '../src/notebooks');
const blogDir = path.join(__dirname, '../src/pages/blog');
const publicNbAssetsDir = path.join(__dirname, '../public/nb-assets');
const cachePath = path.join(__dirname, '.nb-cache.json');

if (!fs.existsSync(publicNbAssetsDir)) fs.mkdirSync(publicNbAssetsDir, { recursive: true });
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

let cache = {};
if (fs.existsSync(cachePath)) {
    try {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch (e) {
        console.error("Failed to load cache", e);
    }
}

function saveCache() {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

function getHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

function processNotebook(filename) {
    if (!filename.endsWith('.ipynb')) return;

    const filePath = path.join(notebooksDir, filename);
    if (!fs.existsSync(filePath)) return;

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const currentHash = getHash(rawData);

    if (cache[filename] === currentHash) {
        return;
    }

    console.log(`Processing: ${filename}`);

    try {
        const notebook = JSON.parse(rawData);
        const slug = filename.replace('.ipynb', '');
        const assetsDir = path.join(publicNbAssetsDir, slug);
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        let mdxContent = "";
        let frontmatter = "";

        const firstCell = notebook.cells[0];
        if (firstCell && (firstCell.cell_type === 'raw' || firstCell.cell_type === 'markdown' || firstCell.cell_type === 'code')) {
            // Allow code cell too if user put YAML in a raw string in code? No, usually markdown/raw. 
            // User edited first cell to be 'code' in step 1235?
            // If first cell is code, validation might fail if looking for markdown.
            // Step 1235 diff shows user changed first cell to 'code'.
            // "cell_type": "code", "source": ["---\n..."]
            // This is valid JSON but weird for a notebook. We should handle it if it contains text.
            const text = Array.isArray(firstCell.source) ? firstCell.source.join('') : firstCell.source;
            if (text && text.trim().startsWith('---')) {
                frontmatter = text;
            }
        }

        if (!frontmatter) {
            frontmatter = `---\nlayout: ../../layouts/MarkdownPostLayout.astro\ntitle: '${slug}'\npubDate: '${new Date().toISOString().split('T')[0]}'\ndescription: 'Converted notebook'\nauthor: 'Native Notebook'\n---\n`;
        }

        mdxContent += frontmatter + "\n";

        // 2. Process Remaining Cells
        // If first cell was frontmatter, content is rest.
        // If first cell wasn't frontmatter (generated default), process all cells? 
        // Logic above: if we found frontmatter, we assume the first cell was successful.
        // If we didn't find frontmatter, we generated it. Should we process the first cell as content?
        // E.g. if user just starts writing, we don't want to lose the first cell.
        // IMPROVEMENT: If frontmatter was found in cell 0, slice(1). Else slice(0).
        let cells = notebook.cells;
        if (frontmatter && notebook.cells[0] && (Array.isArray(notebook.cells[0].source) ? notebook.cells[0].source.join('') : notebook.cells[0].source).trim().startsWith('---')) {
            cells = notebook.cells.slice(1);
        }

        cells.forEach((cell, index) => {
            if (cell.cell_type === 'markdown') {
                mdxContent += (Array.isArray(cell.source) ? cell.source.join('') : cell.source) + "\n\n";
            } else if (cell.cell_type === 'code') {
                // Add Code Block
                const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
                mdxContent += "```python\n" + source + "\n```\n\n";

                // Handle Outputs
                if (cell.outputs) {
                    cell.outputs.forEach((output, outIndex) => {
                        // Include content in hash to ensure asset updates
                        const hash = crypto.createHash('md5').update(`${slug}-${index}-${outIndex}-${JSON.stringify(output)}`).digest('hex').substring(0, 8);

                        // 1. HTML Output
                        if (output.data && output.data['text/html']) {
                            const htmlContent = Array.isArray(output.data['text/html']) ? output.data['text/html'].join('') : output.data['text/html'];
                            const assetName = `${hash}.html`;
                            const assetPath = path.join(assetsDir, assetName);

                            const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;padding:0;overflow:hidden;}</style></head><body>${htmlContent}</body></html>`;

                            fs.writeFileSync(assetPath, fullHtml);

                            mdxContent += `<iframe src="/nb-assets/${slug}/${assetName}" class="nb-output-frame" style="width:100%; height:400px; border:none;"></iframe>\n\n`;
                        }
                        // 2. Image Output
                        else if (output.data && (output.data['image/png'] || output.data['image/jpeg'])) {
                            const isPng = !!output.data['image/png'];
                            const imgData = isPng ? output.data['image/png'] : output.data['image/jpeg'];
                            const ext = isPng ? 'png' : 'jpg';
                            const assetName = `${hash}.${ext}`;
                            const assetPath = path.join(assetsDir, assetName);

                            fs.writeFileSync(assetPath, Buffer.from(imgData, 'base64'));

                            mdxContent += `![Notebook Output](/nb-assets/${slug}/${assetName})\n\n`;
                        }
                        // 3. Text Output
                        else if (output.text) {
                            const textOut = Array.isArray(output.text) ? output.text.join('') : output.text;
                            mdxContent += "```text\n" + textOut + "\n```\n\n";
                        }
                    });
                }
            }
        });

        // Write MDX file
        const mdxPath = path.join(blogDir, `${slug}.mdx`);
        fs.writeFileSync(mdxPath, mdxContent);

        // Update Cache
        cache[filename] = currentHash;
        saveCache();
        console.log(`Converted ${filename} -> ${slug}.mdx`);

    } catch (err) {
        console.error(`Error processing ${filename}:`, err);
    }
}

// Initial Run
if (fs.existsSync(notebooksDir)) {
    const files = fs.readdirSync(notebooksDir);
    files.forEach(processNotebook);
} else {
    console.log("No notebooks directory found.");
}

// Watch Mode
if (process.argv.includes('--watch')) {
    console.log("Watching notebooks for changes...");
    fs.watch(notebooksDir, (eventType, filename) => {
        if (filename && filename.endsWith('.ipynb')) {
            if (fs.existsSync(path.join(notebooksDir, filename))) {
                processNotebook(filename);
            }
        }
    });
}
