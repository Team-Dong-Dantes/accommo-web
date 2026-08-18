/**
 * Cloudinary client-side upload helper (unsigned).
 *
 * Uses Cloudinary's unsigned upload endpoint so NO API secret is exposed
 * in client code. Requires two env vars that are PUBLIC and browser-safe:
 *   VITE_CLOUDINARY_CLOUD_NAME    — your cloud name (e.g. n5mhxcnb)
 *   VITE_CLOUDINARY_UPLOAD_PRESET — an UNSIGNED upload preset you created
 *                                    (Settings → Upload → Upload presets)
 *
 * Images are uploaded with auto-optimization (fetch_format auto + q_auto)
 * appended to the returned URL, so browsers always receive a compressed
 * WebP/AVIF. Supports single files or multiple files per call.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const UPLOAD_ENDPOINT = CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  : '';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
  );
}

function localErrorMessage(): string {
  return 'Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment.';
}

/**
 * Validates a File against the app's allowed types + size cap.
 * Returns an error message, or null if the file is valid.
 */
export function validateCloudinaryFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 5MB.';
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG and WebP images are allowed.';
  }
  return null;
}

/**
 * Uploads one or more files to Cloudinary via the unsigned preset.
 * @param files   A single File or an array of Files.
 * @param folder  Optional virtual folder to organize assets (e.g. 'avatars').
 * @returns       An array of result objects; the first for a single file.
 */
export async function uploadToCloudinary(
  files: File | File[],
  folder?: string,
): Promise<CloudinaryUploadResult[]> {
  if (!CLOUD_NAME || !UPLOAD_PRESET || !UPLOAD_ENDPOINT) {
    throw new Error(localErrorMessage());
  }

  const list = Array.isArray(files) ? files : [files];
  const results = await Promise.all(list.map(async (file) => {
    const validationError = validateCloudinaryFile(file);
    if (validationError) throw new Error(validationError);

    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', UPLOAD_PRESET);
    // Only include a folder tag on the preset if the preset allows folders.
    if (folder) form.append('folder', folder);

    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Cloudinary upload failed (${response.status}): ${body || response.statusText}`);
    }

    const json = await response.json();
    return {
      publicId: json.public_id,
      url: optimizeUrl(json.secure_url),
      secureUrl: json.secure_url,
      width: json.width,
      height: json.height,
      format: json.format,
      bytes: json.bytes,
    } satisfies CloudinaryUploadResult;
  }));

  return results;
}

/** Convenience wrapper: upload a single file, throw on error. */
export async function uploadCloudinaryFile(
  file: File,
  folder?: string,
): Promise<CloudinaryUploadResult> {
  const [result] = await uploadToCloudinary(file, folder);
  if (!result) throw new Error('Cloudinary upload returned no result.');
  return result;
}
