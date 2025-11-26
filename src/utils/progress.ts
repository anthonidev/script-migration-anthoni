import cliProgress from 'cli-progress';
import chalk from 'chalk';

export class ProgressUtils {
  static createBar(format: string) {
    return new cliProgress.SingleBar(
      {
        format: format,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
        clearOnComplete: false,
        stopOnComplete: true,
        forceRedraw: true,
      },
      cliProgress.Presets.shades_classic,
    );
  }

  static getStandardFormat(taskName: string) {
    return `${chalk.cyan(' ' + taskName)} [${chalk.green('{bar}')}] {percentage}% | {value}/{total} items`;
  }
}
