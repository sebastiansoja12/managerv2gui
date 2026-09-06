const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'src/theme/technical-refresh.css');
const visited = new Set();

function visit(file) {
    assert(!visited.has(file), `Duplicate or circular style import: ${file}`);
    visited.add(file);
    const ast = postcss.parse(fs.readFileSync(file, 'utf8'), {from: file});
    if (file === entry) {
        assert(ast.nodes.every(node => node.type === 'comment' || (node.type === 'atrule' && node.name === 'import')),
            'technical-refresh.css must contain imports only; put rules in shared or feature sheets.');
    }
    ast.walkAtRules('import', rule => {
        if (/https?:/.test(rule.params)) return; // Existing Google Fonts import.
        const imported = rule.params.match(/^["'](.+)["']$/);
        assert(imported, `Unsupported local import: ${rule.params}`);
        visit(path.resolve(path.dirname(file), imported[1]));
    });
}

visit(entry);

function checkFeatureImports(directory) {
    for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
        const file = path.join(directory, item.name);
        if (item.isDirectory()) checkFeatureImports(file);
        else if (/^technical-.*\.css$/.test(item.name)) {
            assert(visited.has(file), `Feature sheet is not registered in the theme manifest: ${file}`);
        }
    }
}

checkFeatureImports(path.join(root, 'src/components'));

// Check the core text/surface pairs in every saved skin without changing palettes.
const themes = new Map();
const base = {};
const palette = postcss.parse(fs.readFileSync(path.join(root, 'src/index.css'), 'utf8'));
palette.walkRules(rule => {
    const name = rule.selector.match(/^:root(?:,\s*:root)?\[data-theme="([^"]+)"\]$/)?.[1];
    if (!name) return;
    const tokens = {...base};
    rule.walkDecls(decl => { if (decl.prop.startsWith('--')) tokens[decl.prop] = decl.value; });
    if (name === 'logistics-light') Object.assign(base, tokens);
    themes.set(name, tokens);
});

function luminance(hex) {
    assert(/^#[0-9a-f]{6}$/i.test(hex), `Expected a hex palette token, got ${hex}`);
    const channels = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
        .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

assert(themes.size >= 16, 'Saved skins must remain available.');
for (const [name, tokens] of themes) {
    for (const [text, surface] of [['--foreground', '--background'], ['--card-foreground', '--card'], ['--muted-foreground', '--card']]) {
        const a = luminance(tokens[text]);
        const b = luminance(tokens[surface]);
        const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        assert(contrast >= 4.5, `${name}: ${text} on ${surface} has contrast ${contrast.toFixed(2)} (minimum 4.5).`);
    }
}

console.log(`Styles OK: ${visited.size - 1} imported sheets, no missing/duplicate imports, ${themes.size} skins with readable core text.`);
