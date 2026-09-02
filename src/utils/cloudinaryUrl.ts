// Cloudinary URL helpers (web). Mirrors accommo-mobile/src/shared/utils/cloudinaryUrl.ts
// so that a stored Cloudinary asset is served optimized regardless of which app
// fetched it. Non-Cloudinary URLs (legacy Supabase storage, external) pass through.

const CLOUD_DELIVERY_RE = /(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/;

/** True when the URL points at a Cloudinary delivery. */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url && /res\.cloudinary\.com\/[^/]+\/(image|video|raw|auto)\/upload\//.test(url)
}

/**
 * Normalize a Cloudinary image URL to `/f_auto,q_auto/` (idempotent).
 * PDFs / raw / video assets are returned unchanged.
 */
export function optimizeCloudinaryUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.includes('/f_auto,q_auto/')) return url
  return url.replace(CLOUD_DELIVERY_RE, (m) => `${m}f_auto,q_auto/`)
}

/** Best run-time form for any stored asset URL. */
export function resolveAsset(url: string | null | undefined): string {
  if (!url) return ''
  return isCloudinaryUrl(url) ? optimizeCloudinaryUrl(url) : url
}
