'use strict';
/* eslint-disable @typescript-eslint/naming-convention */
export enum LogLevel {
  Debug,
  Verbose,
  Normal,
  Warning,
  Error,
}

export interface ILogger {
  show(): void;
  verbose(message: string): void;
  debug(message: string): void;
  normal(message: string): void;
  warning(message: string): void;
  error(message: string): void;
}
