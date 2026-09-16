// Shared document-file helpers for the verification feature.
// Extracted verbatim from VerificationReview.vue so both the review shell
// (doc list in the right rail) and DocumentViewer (carousel) use one copy.

const IMAGE_FORMAT = /^(png|jpe?g|webp|gif|bmp|avif)$/i

function extensionOf(value: string): string {
  return /\.([a-z0-9]+)$/i.exec(value || '')?.[1] ?? ''
}

/**
 * Whether a document should render as an image.
 *
 * This used to test the URL for a trailing extension, which every signed
 * document failed. `doc-access` hands back a Cloudinary API download URL —
 * `https://api.cloudinary.com/v1_1/<cloud>/image/download?...&format=jpg&...` —
 * so the path has no extension and the test returned false for all 34
 * verification documents. They all fell through to the `<iframe>` branch, which
 * the page's CSP then blocked outright.
 *
 * Three sources, in order of authority:
 *   1. `format` on the signed URL — what Cloudinary will actually deliver.
 *   2. The stored filename, for rows whose display name is a real file name.
 *   3. The URL's own extension, for the legacy rows that still hold a plain URL.
 */
export function isImage(url: string, filename?: string): boolean {
  const signedFormat = new URLSearchParams(url.split('?')[1] ?? '').get('format')
  if (signedFormat) return IMAGE_FORMAT.test(signedFormat)

  const fromName = extensionOf(filename ?? '')
  if (fromName) return IMAGE_FORMAT.test(fromName)

  return IMAGE_FORMAT.test(extensionOf(url))
}

export function fileIcon(name: string): string {
  if (/\.pdf$/i.test(name || '')) return 'lucide:file-text'
  if (/\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(name || '')) return 'lucide:file-image'
  return 'lucide:file-text'
}
