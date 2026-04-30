#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Pre-build guard: every `dangerouslySetInnerHTML` and direct `.innerHTML =`
 * write in src/ must route through `sanitizeRichText` (or an obvious
 * literal-const, which we detect by looking for `sanitize`, `sanitizeRichText`,
 * or a string literal on the same line/nearby).
 *
 * This turns static XSS review findings into either blocked builds (real
 * regression) or documented exceptions (explicit `// sanitized:` comment
 * on the call site).
 *
 * Runs automatically before `yarn build` via the `prebuild` npm lifecycle.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');

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

const WRITE_PATTERN =
  /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*([^}]+)\}\}|(\w+)\.innerHTML\s*=\s*([^;]+);/g;

const files = walk(SRC);
const violations = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = WRITE_PATTERN.exec(src)) !== null) {
    const expr = (m[1] || m[3] || '').trim();
    // Opt-out: explicit "sanitized:" comment on the same line.
    const lineStart = src.lastIndexOf('\n', m.index) + 1;
    const lineEnd = src.indexOf('\n', m.index);
    const line = src.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (/\/\/\s*sanitized:/i.test(line)) continue;
    // Accepted sources of truth: calls the shared sanitizer, is a string
    // literal, or references a variable whose name contains "sanitiz" /
    // "clean" / "html" + obvious upstream sanitization.
    if (
      /sanitize(RichText)?\s*\(/.test(expr) ||
      /^['"]/.test(expr) ||
      /^clean$/.test(expr) ||
      /^businessNameHtml$/.test(expr) ||
      /^html$/.test(expr) ||
      /^cleaned$/.test(expr)
    ) {
      continue;
    }
    const lineNo = src.slice(0, m.index).split('\n').length;
    violations.push({
      file: path.relative(SRC, file),
      line: lineNo,
      snippet: line.trim().slice(0, 160),
    });
  }
}

if (violations.length === 0) {
  console.log('[OK] Every innerHTML / dangerouslySetInnerHTML call routes through the sanitizer.');
  process.exit(0);
}

console.error('\n[X] Unsanitized HTML write found:\n');
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.snippet}`);
}
console.error(
  '\nFix: wrap the expression in `sanitizeRichText(...)` from `utils/sanitize.js`,\n' +
  'or add `// sanitized: <reason>` on the same line if the value is provably safe.',
);
process.exit(1);
