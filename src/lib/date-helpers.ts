export function addDays(date: Date | string, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addHours(date: Date | string, hours: number): Date {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

export function isExpired(date: Date | string): boolean {
  return new Date(date) < new Date()
}

export function getDaysUntil(date: Date | string): number {
  const now = new Date()
  const target = new Date(date)
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function getDateRange(startDate: Date | string, endDate: Date | string): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export function isYesterday(date: Date | string): boolean {
  const d = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

export function startOfDay(date: Date | string): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date | string): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
