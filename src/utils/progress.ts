import cliProgress from 'cli-progress';
import chalk from 'chalk';
import { Logger } from './logger.js';

export class ProgressUtils {
  static createBar(format: string, logger?: Logger) {
    if (process.stdout.isTTY) {
      return new cliProgress.SingleBar(
        {
          format: format,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true,
          clearOnComplete: false,
          stopOnComplete: true,
          forceRedraw: true,
          stream: process.stdout,
        },
        cliProgress.Presets.shades_classic,
      );
    } else {
      return new SimpleProgressBar(logger);
    }
  }

  static getStandardFormat(taskName: string) {
    return `${chalk.cyan(' ' + taskName)} [${chalk.green('{bar}')}] {percentage}% | {value}/{total} items`;
  }
}

class SimpleProgressBar {
  private total = 0;
  private current = 0;
  private nextLogThreshold = 0;

  constructor(private logger?: Logger) {}

  start(total: number, startValue: number) {
    this.total = total;
    this.current = startValue;
    this.nextLogThreshold = 0;
  }

  increment(amount = 1) {
    this.current += amount;
    const percentage = Math.floor((this.current / this.total) * 100);

    // Log every 20% (approx) or when complete
    if (percentage >= this.nextLogThreshold) {
      const msg = `⏳ Progress: ${percentage}% (${this.current}/${this.total})`;
      if (this.logger) {
        this.logger.info(msg);
      } else {
        console.log(msg);
      }
      this.nextLogThreshold += 20;
    }
  }

  update(value: number) {
    const previousPercentage = Math.floor((this.current / this.total) * 100);
    this.current = value;
    const percentage = Math.floor((this.current / this.total) * 100);

    // Log if crossed a 20% threshold
    if (percentage >= this.nextLogThreshold || percentage < previousPercentage) {
      const msg = `⏳ Progress: ${percentage}% (${this.current}/${this.total})`;
      if (this.logger) {
        this.logger.info(msg);
      } else {
        console.log(msg);
      }
      this.nextLogThreshold = Math.floor(percentage / 20) * 20 + 20;
    }
  }

  stop() {
    // Optional: Log completion
  }
}
