'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { ConnectionManager, IConnectionConfiguration, ConnectionType } from './connection';

const langID = 'puppet'; // don't change this
var statusBarItem;
var serverProc;

var connManager: ConnectionManager = undefined;

export class ConnectionConfiguration implements IConnectionConfiguration {
  public type: ConnectionType = ConnectionType.Unknown; 
  public host: string = undefined;
  public port: number = undefined;
  public stopOnClientExit: string = undefined;
  public timeout: string = undefined;
  public preLoadPuppet: string = undefined;

  constructor(context: vscode.ExtensionContext) {
    let config = vscode.workspace.getConfiguration('puppet');

    this.host             = config['languageserver']['address']; // '127.0.0.1';
    this.port             = config['languageserver']['port']; // 8081;
    this.stopOnClientExit = config['languageserver']['stopOnClientExit']; // true;
    this.timeout          = config['languageserver']['timeout']; // 10;
    this.preLoadPuppet    = config['languageserver']['preLoadPuppet']; // true;
  }
}

export function activate(context: vscode.ExtensionContext) {
  connManager = new ConnectionManager(context);

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
