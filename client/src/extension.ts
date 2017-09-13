'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { ConnectionManager, IConnectionConfiguration, ConnectionType } from './connection';
import { Logger } from './logging';
import { Reporter } from './telemetry/telemetry';

const langID = 'puppet'; // don't change this
var statusBarItem;
var serverProc;

var connManager: ConnectionManager = undefined;

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

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new Reporter(context));
  var logger = new Logger();
  connManager = new ConnectionManager(context, logger);

  var configSettings = new ConnectionConfiguration(context);
  connManager.start(configSettings);
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (connManager != undefined) {
    connManager.stop();
    connManager.dispose();
  }
}
