'use strict';

import * as vscode from 'vscode';

import { IConnectionConfiguration, ConnectionType, ProtocolType } from './interfaces';
import { ConnectionManager } from './connection';

export class ConnectionConfiguration implements IConnectionConfiguration {
  public type: ConnectionType = ConnectionType.Unknown; 
  public protocolType: ProtocolType = ProtocolType.UNKNOWN; 
  public host: string = undefined;
  public port: number = undefined;
  public timeout: number = undefined;
  public preLoadPuppet: boolean = undefined;
  public debugFilePath: string = undefined;
  public puppetAgentDir: string = undefined;

  constructor(context: vscode.ExtensionContext) {
    let config = vscode.workspace.getConfiguration('puppet');

    switch(config['languageserver']['protocol']){
      case 'stdio':
       this.protocolType = ProtocolType.STDIO;
       break;
      case 'tcp':
        this.protocolType = ProtocolType.TCP;
        break;
      default:
        this.protocolType = ProtocolType.STDIO;
        break;
    }

    this.host          = config['languageserver']['address'];
    this.port          = config['languageserver']['port'];
    this.timeout       = config['languageserver']['timeout'];
    this.preLoadPuppet = config['languageserver']['preLoadPuppet'];
    this.debugFilePath = config['languageserver']['debugFilePath'];
    
    this.puppetAgentDir = config['puppetAgentDir'];
  }
}
