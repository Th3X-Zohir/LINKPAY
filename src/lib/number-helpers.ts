export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function roundToDecimal(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return roundToDecimal((value / total) * 100, 2)
}

export function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}

export function convertPaisaToTaka(paisa: number): number {
  return roundToDecimal(paisa / 100, 2)
}

export function convertTakaToPaisa(taka: number): number {
  return Math.round(taka * 100)
}
