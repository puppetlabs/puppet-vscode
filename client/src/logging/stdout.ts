'use strict';

import * as logging from '../logging';

export class StandardOutLogger implements logging.ILogger {
  public show() {}

  public verbose(message: string) { this.emitMessage("VERBOSE",message); }
  public debug(message: string)   { this.emitMessage("DEBUG",message); }
  public normal(message: string)  { this.emitMessage("NORMAL",message); }
  public warning(message: string) { this.emitMessage("WARNING",message); }
  public error(message: string)   { this.emitMessage("ERROR",message); }
  
  private emitMessage(severity: string, message: string) {
    if (process.stdout.writable) {
      process.stdout.write(severity + ": " + message + "\n");
    }
  }
}