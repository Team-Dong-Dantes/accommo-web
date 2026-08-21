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

/* Token-driven base options shared by every Accommo chart, so pages don't
    re-declare toolbar/font/background/tooltip boilerplate. Merged under any
    preset and the caller's own options. */
export function chartBase(type: string): any {
  const ct = chartTheme()
  return {
    chart: {
      type,
      toolbar: { show: false },
      fontFamily: ct.fontFamily,
      background: 'transparent',
      height: '100%',
      animations: { enabled: true, speed: 500 },
    },
    colors: ct.palette,
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { theme: ct.tooltipTheme },
  }
}

/* Chart-type presets. Callers pass `preset` instead of hand-writing
    stroke/fill/grid/plotOptions every time. */
export function chartPreset(preset: 'area' | 'bar' | 'donut' | 'line' | ''): any {
  const ct = chartTheme()
  if (preset === 'area') {
    return {
      stroke: { curve: 'smooth', width: 2.5 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.04, stops: [0, 90, 100] } },
      yaxis: { show: false },
      grid: { show: true, borderColor: ct.gridColor, strokeDashArray: 4 },
    }
  }
  if (preset === 'bar') {
    return {
      plotOptions: { bar: { horizontal: true, borderRadius: 5, columnWidth: '60%', distributed: false } },
      xaxis: { max: 100 },
      grid: { show: true, borderColor: ct.gridColor, strokeDashArray: 4 },
    }
  }
  if (preset === 'donut') {
    return {
      plotOptions: { pie: { donut: { size: '60%' } } },
      stroke: { width: 2 },
    }
  }
  if (preset === 'line') {
    return {
      stroke: { curve: 'smooth', width: 2.5 },
      grid: { show: true, borderColor: ct.gridColor, strokeDashArray: 4 },
    }
  }
  return {}
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

/* Sum of all donut series — used as the center "total" label formatter. */
export function donutTotal(w: { globals: { seriesTotals: number[] } }): number {
  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
}
