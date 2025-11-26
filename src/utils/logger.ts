import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;

  constructor(level: string = 'info') {
    this.level = this.parseLevel(level);
  }

  private parseLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const coloredTimestamp = chalk.gray(`[${timestamp}]`);

    let coloredLevel = '';
    switch (level) {
      case 'DEBUG':
        coloredLevel = chalk.gray(`[${level}]`);
        break;
      case 'INFO':
        coloredLevel = chalk.blue(`[${level}]`);
        break;
      case 'WARN':
        coloredLevel = chalk.yellow(`[${level}]`);
        break;
      case 'ERROR':
        coloredLevel = chalk.red(`[${level}]`);
        break;
      default:
        coloredLevel = `[${level}]`;
    }

    return `${coloredTimestamp} ${coloredLevel} ${message}`;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  separator(char: string = '-') {
    console.log(chalk.gray(char.repeat(60)));
  }

  emptyLine() {
    console.log('');
  }
}
