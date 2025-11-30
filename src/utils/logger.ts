import chalk from 'chalk'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const levelColor: Record<LogLevel, (msg: string) => string> = {
  info: (msg) => chalk.blue(msg),
  warn: (msg) => chalk.yellow(msg),
  error: (msg) => chalk.red(msg),
  debug: (msg) => chalk.gray(msg)
}

function format(scope: string, level: LogLevel, message: string): string {
  const ts = new Date().toISOString()
  const prefix = `[${ts}] [${scope}] [${level.toUpperCase()}]`
  return `${levelColor[level](prefix)} ${message}`
}

export function createLogger(scope: string) {
  return {
    info: (message: string, ...args: any[]) => console.log(format(scope, 'info', message), ...args),
    warn: (message: string, ...args: any[]) => console.warn(format(scope, 'warn', message), ...args),
    error: (message: string, ...args: any[]) => console.error(format(scope, 'error', message), ...args),
    debug: (message: string, ...args: any[]) => console.debug(format(scope, 'debug', message), ...args)
  }
}
