/* Reads Accommo design tokens at runtime so ApexCharts matches the active
   theme and our single source of truth in tokens.css. */

export function cssVar(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export interface ChartTheme {
  fontFamily: string
  axisColor: string
  inkColor: string
  gridColor: string
  surface: string
  tooltipTheme: 'light' | 'dark'
  palette: string[]
}

export function chartTheme(): ChartTheme {
  return {
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
    axisColor: cssVar('--c-muted', '#6B7770'),
    inkColor: cssVar('--c-ink', '#16211E'),
    gridColor: cssVar('--c-border', '#E7ECF2'),
    surface: cssVar('--c-surface', '#F8FAFC'),
    tooltipTheme: 'light',
    palette: [
      cssVar('--c-primary', '#0F766E'),
      cssVar('--c-accent', '#E0654B'),
      cssVar('--c-warning', '#B45309'),
      cssVar('--c-info', '#0E7490'),
      cssVar('--c-success', '#15803D'),
    ],
  }
}
