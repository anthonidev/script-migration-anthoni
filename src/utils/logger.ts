/**
 * Sistema de logging simple para el scraping
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: '🔍',
      info: '📝',
      warn: '⚠️ ',
      error: '❌',
    }[level];

    let formattedMessage = `${emoji} [${timestamp}] ${message}`;

    if (data) {
      formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
    }

    return formattedMessage;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, error));
    }
  }

  success(message: string, data?: any): void {
    console.log(`✅ ${message}`);
    if (data) {
      console.log(data);
    }
  }

  progress(current: number, total: number, message?: string): void {
    const percentage = ((current / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(current / total * 20));
    const empty = '░'.repeat(20 - Math.floor(current / total * 20));
    console.log(`⏳ [${bar}${empty}] ${percentage}% (${current}/${total}) ${message || ''}`);
  }
}

// Singleton instance
const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
export const logger = new Logger(logLevel);
