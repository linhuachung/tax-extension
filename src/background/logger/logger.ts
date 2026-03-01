import { log as coreLog } from '../../core/logger'
import type { LogLevel } from '../../domain/schemas/env'
import { env } from '../../domain/utils/env'

type LogRecord = {
  ts: string
  level: Exclude<LogLevel, 'silent'>
  phase: string
  module: string
  msg: string
  data?: unknown
}

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
}

const shouldLog = (level: Exclude<LogLevel, 'silent'>): boolean => {
  const configured = env.VITE_LOG_LEVEL
  return levelRank[level] >= levelRank[configured]
}

const emit = (level: Exclude<LogLevel, 'silent'>, record: LogRecord): void => {
  if (level === 'error') coreLog.error(record)
  else if (level === 'warn') coreLog.warn(record)
  else if (level === 'info') coreLog.info(record)
  else coreLog.debug(record)
}

export type Logger = {
  info: (msg: string, data?: unknown) => void
  warn: (msg: string, data?: unknown) => void
  error: (msg: string, data?: unknown) => void
  debug: (msg: string, data?: unknown) => void
}

export const createLogger = (module: string): Logger => {
  const phase = env.VITE_APP_PHASE

  const log =
    (level: Exclude<LogLevel, 'silent'>) =>
    (msg: string, data?: unknown): void => {
      if (!shouldLog(level)) return
      emit(level, {
        ts: new Date().toISOString(),
        level,
        phase,
        module,
        msg,
        data,
      })
    }

  return {
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    debug: log('debug'),
  }
}
