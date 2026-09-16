import { describe, it, expect } from 'vitest'
import { isImage, fileIcon } from './fileUtils'

// The regression this guards: isImage() tested the URL for a trailing
// extension, and every signed document URL ends in query parameters, so all of
// them were classified as non-images and routed to a CSP-blocked <iframe>.
const SIGNED_JPG =
  'https://api.cloudinary.com/v1_1/demo/image/download?timestamp=1788885526&public_id=accommo%2Fdocs%2Fabc%2Fxyz&format=jpg&type=authenticated&expires_at=1788885826&signature=deadbeef&api_key=123'
const SIGNED_PDF = SIGNED_JPG.replace('format=jpg', 'format=pdf')

describe('isImage', () => {
  it('reads the format from a signed Cloudinary download URL', () => {
    expect(isImage(SIGNED_JPG)).toBe(true)
    expect(isImage(SIGNED_PDF)).toBe(false)
  })

  it('prefers the signed format over a misleading filename', () => {
    expect(isImage(SIGNED_PDF, 'scan.jpg')).toBe(false)
    expect(isImage(SIGNED_JPG, 'permit.pdf')).toBe(true)
  })

  it('falls back to the filename when the URL carries no format', () => {
    // Accommodation permits display a label, user documents a real file name.
    expect(isImage('https://res.cloudinary.com/demo/x', 'Screenshot_20260914.jpg')).toBe(true)
    expect(isImage('https://res.cloudinary.com/demo/x', 'sanitary.pdf')).toBe(false)
  })

  it('still handles the legacy rows that hold a plain URL', () => {
    expect(isImage('https://res.cloudinary.com/demo/image/upload/v1/permit.png')).toBe(true)
    expect(isImage('https://res.cloudinary.com/demo/image/upload/v1/permit.pdf')).toBe(false)
  })

  it('treats an unknown shape as not an image rather than guessing', () => {
    expect(isImage('')).toBe(false)
    expect(isImage('https://example.com/no-extension-here')).toBe(false)
    expect(isImage('https://example.com/x', 'Sanitary permit')).toBe(false)
  })
})

describe('fileIcon', () => {
  it('distinguishes pdf, image and everything else', () => {
    expect(fileIcon('permit.pdf')).toBe('lucide:file-text')
    expect(fileIcon('id.jpeg')).toBe('lucide:file-image')
    expect(fileIcon('Sanitary permit')).toBe('lucide:file-text')
  })
})
