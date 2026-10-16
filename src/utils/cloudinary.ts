/**
 * Cloudinary client-side upload helper.
 *
 * Each upload is signed by the `doc-access` edge function (public-upload-params),
 * so the API secret never reaches client code. It used to post to an unsigned
 * preset, which anyone who read the preset name out of the bundle could use.
 *
 * Images are uploaded with auto-optimization (fetch_format auto + q_auto)
 * appended to the returned URL, so browsers always receive a compressed
 * WebP/AVIF. Supports single files or multiple files per call.
 */

import { callEdgeFunction } from '@/utils/edgeFunction'

interface UploadParams {
  cloudName: string; apiKey: string; timestamp: number; publicId: string; allowedFormats: string; signature: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface CloudinaryUploadResult {
  publicId: string;
  /** Optimized, ready-to-use URL (auto format + auto quality). */
  url: string;
  /** Original (untransformed) secure URL — useful for preview/thumb. */
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/** Appends Cloudinary auto-optimization params (auto format + auto quality). */
function optimizeUrl(rawUrl: string): string {
  // Insert /f_auto,q_auto into the delivery path for smaller, faster loads.
  // e.g. https://res.cloudinary.com/<cloud>/image/upload/v1/<id>.png
  //   →   https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/v1/<id>.png
  return rawUrl.replace(
    /(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/,
    (m) => `${m}f_auto,q_auto/`,
  )
}

/**
 * Validates a File against the app's allowed types + size cap.
 * Returns an error message, or null if the file is valid.
 */
export function validateCloudinaryFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 5MB.'
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG and WebP images are allowed.'
  }
  return null
}

/**
 * Uploads one or more files to Cloudinary, each under the uploader's own folder
 * (the signature decides where, not the caller).
 * @param files   A single File or an array of Files.
 * @returns       An array of result objects; the first for a single file.
 */
export async function uploadToCloudinary(
  files: File | File[],
): Promise<CloudinaryUploadResult[]> {
  const list = Array.isArray(files) ? files : [files]
  const results = await Promise.all(list.map(async (file) => {
    const validationError = validateCloudinaryFile(file)
    if (validationError) throw new Error(validationError)

    // One signature per file: it names the exact public_id.
    const params = await callEdgeFunction<UploadParams>('doc-access', { action: 'public-upload-params' })
    const form = new FormData()
    form.append('file', file)
    form.append('api_key', params.apiKey)
    form.append('timestamp', String(params.timestamp))
    form.append('public_id', params.publicId)
    form.append('allowed_formats', params.allowedFormats)
    form.append('signature', params.signature)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Cloudinary upload failed (${response.status}): ${body || response.statusText}`)
    }

    const json = await response.json()
    return {
      publicId: json.public_id,
      url: optimizeUrl(json.secure_url),
      secureUrl: json.secure_url,
      width: json.width,
      height: json.height,
      format: json.format,
      bytes: json.bytes,
    } satisfies CloudinaryUploadResult
  }))

  return results
}

/** Convenience wrapper: upload a single file, throw on error. */
export async function uploadCloudinaryFile(file: File): Promise<CloudinaryUploadResult> {
  const [result] = await uploadToCloudinary(file)
  if (!result) throw new Error('Cloudinary upload returned no result.')
  return result
}
