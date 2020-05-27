'use strict';

import * as logging from '../logging';
import fs = require('fs');

export class FileLogger implements logging.ILogger {
  private logwriter: fs.WriteStream;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public show() {}

  constructor(filename: string) {
    this.logwriter = fs.createWriteStream(filename);
  }

  public verbose(message: string) {
    this.emitMessage('VERBOSE', message);
  }
  public debug(message: string) {
    this.emitMessage('DEBUG', message);
  }
  public normal(message: string) {
    this.emitMessage('NORMAL', message);
  }
  public warning(message: string) {
    this.emitMessage('WARNING', message);
  }
  public error(message: string) {
    this.emitMessage('ERROR', message);
  }

  private emitMessage(severity: string, message: string) {
    if (this.logwriter.writable) {
      this.logwriter.write(severity + ': ' + message + '\n');
    }
  }
}
