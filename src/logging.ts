'use strict';

export enum LogLevel {
  Verbose,
  Debug,
  Normal,
  Warning,
  Error
}

export interface ILogger {
  show(): any;
  verbose(message: string): any;
  debug(message: string): any;
  normal(message: string): any;
  warning(message: string): any;
  error(message: string): any;
}
