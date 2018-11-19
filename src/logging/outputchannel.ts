'use strict';

import * as vscode from 'vscode';
import * as logging from '../logging';
import { ISettings } from '../settings';

export class OutputChannelLogger implements logging.ILogger {
  
  private _logChannel : vscode.OutputChannel;
  public get logChannel() : vscode.OutputChannel {
    return this._logChannel;
  }

  // Minimum log level that is shown to users on logChannel
  private minimumUserLogLevel: logging.LogLevel;

  constructor(settings: ISettings) {
    this._logChannel = vscode.window.createOutputChannel('Puppet');

    let logLevel = settings.editorService.loglevel;

    if (logLevel === undefined) {
      this.minimumUserLogLevel = logging.LogLevel.Normal;
    } else {
      this.minimumUserLogLevel = this.logLevelFromString(logLevel);
    }
  }

  public show() {
    this._logChannel.show();
  }

  public verbose(message: string) {
    this.logWithLevel(logging.LogLevel.Verbose, message);
  }

  public debug(message: string) {
    this.logWithLevel(logging.LogLevel.Debug, message);
  }

  public normal(message: string) {
    this.logWithLevel(logging.LogLevel.Normal, message);
  }

  public warning(message: string) {
    this.logWithLevel(logging.LogLevel.Warning, message);
  }

  public error(message: string) {
    this.logWithLevel(logging.LogLevel.Error, message);
  }

  private logWithLevel(level: logging.LogLevel, message: string) {
    let logMessage = this.logLevelPrefixAsString(level) + new Date().toISOString() + ' ' + message;

    if (level >= this.minimumUserLogLevel) {
      this._logChannel.appendLine(logMessage);
    }
  }

  private logLevelFromString(logLevelName: String): logging.LogLevel {
    switch (logLevelName.toLowerCase()) {
      case 'verbose':
        return logging.LogLevel.Verbose;
      case 'debug':
        return logging.LogLevel.Debug;
      case 'normal':
        return logging.LogLevel.Normal;
      case 'warning':
        return logging.LogLevel.Warning;
      case 'error':
        return logging.LogLevel.Error;
      default:
        return logging.LogLevel.Error;
    }
  }

  private logLevelPrefixAsString(level: logging.LogLevel): String {
    switch (level) {
      case logging.LogLevel.Verbose:
        return 'VERBOSE: ';
      case logging.LogLevel.Debug:
        return 'DEBUG: ';
      case logging.LogLevel.Warning:
        return 'WARNING: ';
      case logging.LogLevel.Error:
        return 'ERROR: ';
      default:
        return '';
    }
  }
}
