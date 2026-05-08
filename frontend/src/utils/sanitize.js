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

/**
 * Convert rich-text HTML to plain text. Used in places that render the
 * value as a text node (sidebar, login header, browser title, alt= attrs,
 * email bodies) — without this, a name like
 *   `<span style="font-family: Arial"><b>TechZone</b></span>`
 * shows up literally on screen with all the tags visible.
 *
 * Strategy: sanitize first (defense in depth), then drop every tag and
 * decode common HTML entities. We DO NOT use DOMParser because it would
 * also execute `<img onerror>` URL fetches if a payload slipped past.
 */
export const stripHtml = (str) => {
  if (!str) return '';
  const clean = sanitizeRichText(String(str));
  return clean
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};
