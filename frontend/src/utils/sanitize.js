import DOMPurify from 'dompurify';

/**
 * Shared HTML sanitization for rich-text content that ends up on receipts,
 * live previews, and the contenteditable editor. Only allows the minimal set
 * of tags + attributes needed for basic formatting on a thermal printer:
 *   - b / i / u / strong / em — inline styling
 *   - span / p / br / div — structure
 *   - font (legacy execCommand output)
 * No events, no URLs, no scripts. DOMPurify drops everything else silently.
 */
const ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'span', 'p', 'br', 'div', 'font'];
const ALLOWED_ATTR = ['style', 'color', 'size', 'face'];

export const sanitizeRichText = (html) =>
  DOMPurify.sanitize(html || '', { ALLOWED_TAGS, ALLOWED_ATTR });

/** Returns true if the string contains at least one HTML tag. */
export const hasHtml = (str) => /<[a-z][\s\S]*>/i.test(str || '');
