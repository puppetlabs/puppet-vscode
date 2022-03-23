import * as path from 'path';
import * as cp from 'promisify-child-process';
import { IAggregateConfiguration } from '../configuration';
import { ILogger } from '../logging';

export interface IExecHelper {
  execute(opts: string[]);
}

export class PctExecHelper implements IExecHelper {
  private readonly logger: ILogger;
  private readonly binPath: string;
  private readonly shell: string;

  constructor(config: IAggregateConfiguration, logger: ILogger) {
    this.logger = logger;
    this.shell = process.env['SHELL'];
    this.binPath = path.join(config.pct.pctBaseDir, 'pct');
  }

  async execute(opts: string[]): Promise<string> {
    const commandString = opts.join(' ');

    if (opts.length < 1) {
      throw new Error('No command options specified');
    }

    this.logger.debug(`Executing: pct ${commandString}`);

    try {
      const { stdout, stderr } = await cp.exec(`${this.binPath} ${commandString}`, {
        shell: this.shell,
      });

      // we should check for stderr here... or shoould we?

      this.logger.normal(`stdout: ${stdout}`);

      return stdout.toString();
    } catch (err) {
      this.logger.error(`Error executing: pct ${commandString}\n${err}`);
      // what do we do here? throw?
    }
  }
}
