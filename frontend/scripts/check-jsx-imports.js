#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Pre-build guard: scan every `src/**\/*.js` for a JSX element that references
 * a PascalCase identifier not imported/declared in that file.
 *
 * This is exactly the class of bug that has bitten production 4 times this
 * month: `DollarSign`, `Ticket`, `MessageSquare`, `Send`, `Mail`, `BarChart3`
 * — all forgotten `import { ... } from 'lucide-react'` entries. CRA's default
 * eslint reports these as *warnings* (non-blocking), so they slip through
 * the build. This script exits with code 1 if any are found, so `yarn build`
 * fails loudly.
 *
 * Runs automatically before `yarn build` via the `prebuild` npm lifecycle.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');

// Known globals we should never flag.
const KNOWN = new Set([
  'React', 'Fragment', 'Component', 'Suspense', 'StrictMode',
  'HTMLElement', 'Element', 'Node', 'Event', 'FormData', 'URL',
  'Math', 'Date', 'JSON', 'Object', 'Array', 'Number', 'String',
  'Boolean', 'RegExp', 'Error', 'TypeError', 'Promise',
]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '__tests__') continue;
      walk(p, out);
    } else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      out.push(p);
    }
  }
  return out;
}

function collectDeclared(src) {
  const names = new Set(KNOWN);
  // Named imports
  for (const m of src.matchAll(/import\s+(?:[\w*]+\s*,\s*)?\{([^}]+)\}\s+from/g)) {
    for (const n of m[1].split(',')) {
      const nm = n.trim().split(' as ').pop().trim();
      if (nm) names.add(nm);
    }
  }
  // Default imports
  for (const m of src.matchAll(/import\s+(\w+)\s+from/g)) names.add(m[1]);
  // Namespace imports
  for (const m of src.matchAll(/import\s+\*\s+as\s+(\w+)\s+from/g)) names.add(m[1]);
  // Local decls
  for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+(\w+)/g)) names.add(m[1]);
  return names;
}

const files = walk(SRC);
const issues = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const declared = collectDeclared(src);
  for (const m of src.matchAll(/<([A-Z][A-Za-z0-9_]*)\b/g)) {
    const name = m[1];
    if (!declared.has(name)) {
      const line = src.slice(0, m.index).split('\n').length;
      issues.push({ file: path.relative(SRC, file), line, name });
    }
  }
}

if (issues.length === 0) {
  console.log('[OK] No undeclared PascalCase JSX identifiers.');
  process.exit(0);
}

console.error('\n[X] Undeclared PascalCase JSX identifiers found:\n');
for (const i of issues) {
  console.error(`  ${i.file}:${i.line}  <${i.name}>  — likely missing from the import statement`);
}
console.error('\nFix: add the missing symbol to the appropriate `import { ... } from ...` line.');
process.exit(1);
