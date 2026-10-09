// Inspect JSX copy, or emit a reviewable patch using the curated Chinese dictionary.
// Never edits files: pipe the returned patch through apply_patch after review.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const roots = process.argv.slice(3);
const files = roots.flatMap(p => fs.statSync(p).isDirectory()
  ? fs.readdirSync(p).filter(n => n.endsWith('.tsx')).map(n => path.join(p, n)) : [p]);
const dictionary = JSON.parse(fs.readFileSync('src/i18n/ui.zh-CN.json', 'utf8'));
const inventory = new Set();
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', deg: '°', middot: '·', rarr: '→', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', Prime: '″', times: '×', sup2: '²', nbsp: ' ' };
const decode = value => value.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (all, key) => key.startsWith('#x') ? String.fromCodePoint(parseInt(key.slice(2), 16)) : key.startsWith('#') ? String.fromCodePoint(Number(key.slice(1))) : entities[key] ?? all);
let patch = '*** Begin Patch\n';
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const changes = [];
  const scopes = new Set();
  function component(n) {
    for (let p = n.parent; p; p = p.parent) {
      if ((ts.isFunctionDeclaration(p) || ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && p.body && ts.isBlock(p.body)) {
        const name = p.name?.text ?? (ts.isVariableDeclaration(p.parent) ? p.parent.name.getText(sf) : '');
        if (/^[A-Z]/.test(name)) return p;
      }
    }
  }
  function visit(n) {
    let value;
    let replacement;
    if (ts.isJsxText(n)) {
      value = n.text.replace(/\s+/g, ' ').trim();
      replacement = v => `{tx(${JSON.stringify(v)})}`;
    } else if (ts.isStringLiteral(n) && ts.isJsxAttribute(n.parent)
      && ['title', 'placeholder', 'aria-label', 'label', 'confirmText', 'cancelText'].includes(n.parent.name.getText(sf))) {
      value = n.text;
      replacement = v => `{tx(${JSON.stringify(v)})}`;
    } else if (ts.isStringLiteral(n)) {
      // Only a direct displayed literal or a ternary's result branch; never its condition.
      if (ts.isJsxExpression(n.parent) || (ts.isConditionalExpression(n.parent)
        && (n.parent.whenTrue === n || n.parent.whenFalse === n)
        && ts.isJsxExpression(n.parent.parent))) {
        value = n.text;
        replacement = v => `tx(${JSON.stringify(v)})`;
      }
    }
    if (value && (/[A-Za-z]{2}/.test(value) || (value === 's' && ts.isConditionalExpression(n.parent) && /\b1\b/.test(n.parent.condition.getText(sf))))) {
      if (ts.isJsxText(n) || ts.isJsxAttribute(n.parent)) value = decode(value);
      const scope = component(n);
      if (scope) {
        inventory.add(value);
        if (Object.hasOwn(dictionary, value)) {
          let next = replacement(value);
          if (ts.isJsxText(n)) {
            if (/^\s/.test(n.text) && !/^\s*\n/.test(n.text)) next = ' ' + next;
            if (/\s$/.test(n.text) && !/\n\s*$/.test(n.text)) next += ' ';
          }
          changes.push({ start: n.getStart(sf), end: n.end, next });
          scopes.add(scope);
        }
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  if (!changes.length) continue;
  for (const scope of scopes) {
    if (!scope.body.statements.some(s => s.getText(sf).includes('const { tx } = useI18n()'))) {
      changes.push({ start: scope.body.getStart(sf) + 1, end: scope.body.getStart(sf) + 1, next: '\n  const { tx } = useI18n();' });
    }
  }
  if (!source.includes('import { useI18n }')) {
    let relative = path.relative(path.dirname(file), 'src/i18n/I18nContext').replaceAll('\\', '/');
    if (!relative.startsWith('.')) relative = './' + relative;
    changes.push({ start: 0, end: 0, next: `import { useI18n } from '${relative}';\n` });
  }
  const groups = [];
  for (const c of changes.sort((a, b) => a.start - b.start)) {
    const start = source.lastIndexOf('\n', c.start - 1) + 1;
    const lineEnd = source.indexOf('\n', c.end);
    const end = lineEnd === -1 ? source.length : lineEnd;
    const last = groups.at(-1);
    if (last && start <= last.end) { last.end = Math.max(last.end, end); last.edits.push(c); }
    else groups.push({ start, end, edits: [c] });
  }
  patch += `*** Update File: ${path.resolve(file).replaceAll('\\', '/')}\n`;
  for (const g of groups) {
    const old = source.slice(g.start, g.end);
    let next = old;
    for (const c of g.edits.sort((a, b) => b.start - a.start)) next = next.slice(0, c.start - g.start) + c.next + next.slice(c.end - g.start);
    patch += '@@\n' + old.replaceAll('\r', '').split('\n').map(l => '-' + l).join('\n') + '\n';
    patch += next.replaceAll('\r', '').split('\n').map(l => '+' + l).join('\n') + '\n';
  }
}
patch += '*** End Patch';
console.log(process.argv[2] === '--patch' ? patch : JSON.stringify([...inventory].sort(), null, 2));
