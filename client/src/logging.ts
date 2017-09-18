'use strict';

import * as vscode from 'vscode';

export enum LogLevel {
    Verbose,
    Debug,
    Normal,
    Warning,
    Error
}

export class Logger {

  private logChannel: vscode.OutputChannel;

  // Minimum log level that is shown to users on logChannel
  private minimumUserLogLevel: LogLevel = undefined;

  constructor() {
    this.logChannel = vscode.window.createOutputChannel("Puppet");

    let config = vscode.workspace.getConfiguration('puppet');
    let logLevelName = config['languageclient']['minimumUserLogLevel'];
    let logLevel = this.logLevelFromString(logLevelName);

    if(logLevel == undefined) {
      this.minimumUserLogLevel = LogLevel.Normal;
      this.error("Logger could not interpret " + logLevelName + " as a log level setting");
    } else {
      this.minimumUserLogLevel = logLevel;
    }
  }

  public show(){
    this.logChannel.show();
  }

  public verbose(message: string) {
    this.logWithLevel(LogLevel.Verbose, message);
  }

  public debug(message: string) {
    this.logWithLevel(LogLevel.Debug, message);
  }

  public normal(message: string) {
    this.logWithLevel(LogLevel.Normal, message);
  }

  public warning(message: string) {
    this.logWithLevel(LogLevel.Warning, message);
  }

  public error(message: string) {
    this.logWithLevel(LogLevel.Error, message);
  }

  private logWithLevel(level: LogLevel, message) {
    let logMessage = this.logLevelPrefixAsString(level) + message

    console.log(logMessage);
    if (level >= this.minimumUserLogLevel) {
      this.logChannel.appendLine(logMessage);
    }
  }

  private logLevelFromString(logLevelName: String): LogLevel {
    switch (logLevelName.toLowerCase()) {
      case "verbose": return LogLevel.Verbose;
      case "debug": return LogLevel.Debug;
      case "normal": return LogLevel.Normal;
      case "warning": return LogLevel.Warning;
      case "error": return LogLevel.Error;
      default:  return undefined;
    }
  }

  private logLevelPrefixAsString(level: LogLevel): String {
    switch (level) {
      case LogLevel.Verbose: return "VERBOSE: ";
      case LogLevel.Debug: return "DEBUG: ";
      case LogLevel.Warning: return "WARNING: ";
      case LogLevel.Error: return "ERROR: ";
      default: return "";
    }
  }
}

