'use strict';

import * as vscode from 'vscode';

import { ConnectionManager, IConnectionConfiguration, ConnectionType } from './connection';

export class ConnectionConfiguration implements IConnectionConfiguration {
  public type: ConnectionType = ConnectionType.Unknown; 
  public host: string = undefined;
  public port: number = undefined;
  public timeout: number = undefined;
  public preLoadPuppet: boolean = undefined;
  public debugFilePath: string = undefined;
  public puppetAgentDir: string = undefined;

  constructor(context: vscode.ExtensionContext) {
    let config = vscode.workspace.getConfiguration('puppet');

    this.host          = config['languageserver']['address'];
    this.port          = config['languageserver']['port'];
    this.timeout       = config['languageserver']['timeout'];
    this.preLoadPuppet = config['languageserver']['preLoadPuppet'];
    this.debugFilePath = config['languageserver']['debugFilePath'];
    
    this.puppetAgentDir = config['puppetAgentDir'];
  }
}
