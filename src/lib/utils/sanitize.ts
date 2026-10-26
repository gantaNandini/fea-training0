import sanitizeHtml from 'sanitize-html'

/**
 * Allow-list sanitizer for rich HTML (Course.description, Page.body) — REQ-010.
 * Used on save and again on render.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'p',
    'br',
    'hr',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'blockquote',
    'code',
    'pre',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  transformTags: {
    a: (_tag, attribs) => ({
      tagName: 'a',
      attribs: { ...attribs, rel: 'noopener noreferrer' },
    }),
    img: (_tag, attribs) => ({
      tagName: 'img',
      attribs: { ...attribs, alt: attribs.alt ?? '', loading: 'lazy' },
    }),
  },
}

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, options)
}
