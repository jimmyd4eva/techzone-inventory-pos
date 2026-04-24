/**
 * Regression test for the shared HTML sanitizer used on receipts, live
 * previews, and the rich-text editor. If any of these assertions break,
 * an XSS payload has become renderable somewhere in the app.
 *
 * Run:  yarn jest src/utils/__tests__/sanitize.test.js
 */
import { sanitizeRichText, hasHtml } from '../sanitize';

describe('sanitizeRichText', () => {
  test('strips <img onerror>', () => {
    const out = sanitizeRichText('<img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/<img/i);
  });

  test('strips <script>', () => {
    const out = sanitizeRichText('<script>alert(1)</script>');
    expect(out).not.toMatch(/script/i);
  });

  test('strips inline event handlers', () => {
    const out = sanitizeRichText('<div onclick="alert(1)">click</div>');
    expect(out).not.toMatch(/onclick/i);
    expect(out).toBe('<div>click</div>');
  });

  test('strips javascript: URLs by dropping the <a>', () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">link</a>');
    // <a> is NOT in ALLOWED_TAGS so the whole anchor is dropped — both the
    // tag and the dangerous href disappear.
    expect(out).not.toMatch(/javascript:/i);
    expect(out).not.toMatch(/<a/i);
  });

  test('preserves legitimate formatting', () => {
    const legit = 'Hello <b>bold</b> and <span style="color:red">red</span>';
    const out = sanitizeRichText(legit);
    expect(out).toContain('<b>bold</b>');
    expect(out).toContain('<span style="color:red">red</span>');
  });

  test('handles empty/null/undefined safely', () => {
    expect(sanitizeRichText('')).toBe('');
    expect(sanitizeRichText(null)).toBe('');
    expect(sanitizeRichText(undefined)).toBe('');
  });
});

describe('hasHtml', () => {
  test('detects HTML tags', () => {
    expect(hasHtml('<b>bold</b>')).toBe(true);
    expect(hasHtml('Hi <span>world</span>')).toBe(true);
  });

  test('returns false for plain text', () => {
    expect(hasHtml('Hello world')).toBe(false);
    expect(hasHtml('')).toBe(false);
    expect(hasHtml(null)).toBe(false);
  });
});
