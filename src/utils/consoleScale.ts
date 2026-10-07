import { onMounted, onUnmounted } from 'vue'

/**
 * Shrinks the admin console to fit smaller laptops and tablets.
 *
 * The console is drawn for a 1440×900 screen, and most of its sizes are fixed
 * px, so on a 1366×768 laptop or a 1024×600 tablet everything stayed full size
 * in less room. Rather than rewrite every size, the console is zoomed by how far
 * the screen falls short of 1440×900 on either side, with a floor so text never
 * gets too small. A 1440×900 screen and up is untouched.
 *
 * What zooms is the admin layout and every dialog (the --console-zoom rule in
 * app.css), not the page root. Quasar places menus, selects and tooltips from
 * measured screen coordinates and does not correct for zoom, so on a zoomed
 * root each one landed 25% short of its anchor; outside the zoom they land
 * right and keep their normal size.
 *
 * Zoom shrinks vw/vh along with everything else, so `--vw` / `--vh` carry one
 * real viewport percent for the panels sized to the screen inside the zoom. The
 * fluid spacing tokens (--u, --ut in tokens.css) are pinned to their full 8px
 * while zoomed, or they would shrink a second time on top of the zoom.
 */
export const DESIGN_W = 1440
export const DESIGN_H = 900
export const MIN_SCALE = 0.75

export function consoleScale(w: number, h: number): number {
  const s = Math.min(w / DESIGN_W, h / DESIGN_H, 1)
  return Math.round(Math.max(s, MIN_SCALE) * 100) / 100
}

const PROPS = ['--console-zoom', '--vw', '--vh', '--u', '--ut'] as const

export function clearConsoleScale(): void {
  const root = document.documentElement.style
  PROPS.forEach((p) => root.removeProperty(p))
}

export function applyConsoleScale(): void {
  const root = document.documentElement.style
  const s = consoleScale(window.innerWidth, window.innerHeight)
  if (s === 1) return clearConsoleScale()
  root.setProperty('--console-zoom', String(s))
  root.setProperty('--vw', `${window.innerWidth / 100 / s}px`)
  root.setProperty('--vh', `${window.innerHeight / 100 / s}px`)
  root.setProperty('--u', '8px')
  root.setProperty('--ut', '8px')
}

/** The zoom the console is drawn at right now; 1 when unscaled. */
export function consoleZoom(): number {
  return Number(document.documentElement.style.getPropertyValue('--console-zoom')) || 1
}

/**
 * A QPage :style-fn that fills the space under the header. Quasar hands over
 * the window height in screen px; inside the zoom that many px would come up
 * short, so it is converted first.
 */
export const fitViewport = (offset: number, height: number) => ({
  height: `${height / consoleZoom() - offset}px`,
})

/** For the admin layouts only; the public landing page must not zoom. */
export function useConsoleScale(): void {
  onMounted(() => {
    applyConsoleScale()
    window.addEventListener('resize', applyConsoleScale)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', applyConsoleScale)
    clearConsoleScale()
  })
}
