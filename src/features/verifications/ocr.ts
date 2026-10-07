import { createWorker, OEM } from 'tesseract.js'
// Served from this site, not tesseract.js's default CDN: index.html's CSP only
// allows scripts from 'self'. Loaded as a plain same-origin worker
// (workerBlobURL: false), so the worker carries no page CSP for its wasm.
import workerPath from 'tesseract.js/dist/worker.min.js?url'
import corePath from 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url'

/**
 * The text on an uploaded image, read in this browser. For a document the
 * phone did not read (picked from files rather than scanned), or a second
 * opinion on one it did. A few seconds per page; the English data
 * (public/tessdata, ~3 MB) is fetched once and cached by the browser.
 *
 * ponytail: images only. A PDF is left to the reviewer's eye; render page one
 * with pdfjs-dist first if PDFs turn out to be common.
 */
export async function readImageText(url: string): Promise<string> {
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    workerPath,
    corePath,
    langPath: '/tessdata',
    workerBlobURL: false,
  })
  try {
    const { data } = await worker.recognize(url)
    return data.text
  } finally {
    await worker.terminate()
  }
}
