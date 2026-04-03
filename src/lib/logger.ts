type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const currentLevel = process.env.LOG_LEVEL as LogLevel || 'info'

function formatMessage(level: LogLevel, message: string): string {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

export const logger = {
  debug(message: string): void { if (shouldLog('debug')) console.debug(formatMessage('debug', message)) },
  info(message: string): void { if (shouldLog('info')) console.info(formatMessage('info', message)) },
  warn(message: string): void { if (shouldLog('warn')) console.warn(formatMessage('warn', message)) },
  error(message: string): void { if (shouldLog('error')) console.error(formatMessage('error', message)) },
}
