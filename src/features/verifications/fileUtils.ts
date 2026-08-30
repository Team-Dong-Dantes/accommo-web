// Shared document-file helpers for the verification feature.
// Extracted verbatim from VerificationReview.vue so both the review shell
// (doc list in the right rail) and DocumentViewer (carousel) use one copy.

export function isImage(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(url || '')
}

export function fileIcon(name: string): string {
  if (/\.pdf$/i.test(name || '')) return 'mdi:file-pdf-box'
  if (/\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(name || '')) return 'mdi:file-image-outline'
  return 'mdi:file-document-outline'
}
