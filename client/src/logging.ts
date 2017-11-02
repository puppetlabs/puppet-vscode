'use strict';

import * as vscode from 'vscode';

export enum LogLevel {
  Verbose,
  Debug,
  Normal,
  Warning,
  Error
}

export interface ILogger {
  show();
  verbose(message: string);
  debug(message: string);
  normal(message: string);
  warning(message: string);
  error(message: string);
}
