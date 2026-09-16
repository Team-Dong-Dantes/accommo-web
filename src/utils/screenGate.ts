/** Smallest screen the OSAS console is laid out for: a tablet in landscape. */
export const MIN_LONG_EDGE = 1024
export const MIN_SHORT_EDGE = 600

/** Null means show the app. See `components/layout/ScreenGate.vue`. */
export type ScreenGateState = 'rotate' | 'small' | null

/**
 * Decides what a touch device should be shown at this size.
 *
 * Measured against the longest and shortest edge rather than the current width,
 * so a portrait phone is told it is too small — rotating will not save it —
 * while a portrait tablet is told to rotate. A CSS `orientation` media query
 * cannot tell those two apart, which is why this is computed in script.
 *
 * `isTouch` false always returns null: a desktop browser window dragged narrow
 * is somebody working, and blocking that mid-task is worse than a cramped
 * layout.
 */
export function screenGateState(width: number, height: number, isTouch: boolean): ScreenGateState {
  if (!isTouch) return null
  if (Math.max(width, height) < MIN_LONG_EDGE || Math.min(width, height) < MIN_SHORT_EDGE) {
    return 'small'
  }
  return height > width ? 'rotate' : null
}
