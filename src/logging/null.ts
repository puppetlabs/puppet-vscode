'use strict';

import * as logging from '../logging';

export class NullLogger implements logging.ILogger {
  public show() {}

  public verbose(message: string) { }
  public debug(message: string)   { }
  public normal(message: string)  { }
  public warning(message: string) { }
  public error(message: string)   { }
}
