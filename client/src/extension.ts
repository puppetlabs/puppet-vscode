'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { SessionManager } from '../src/languageserver';

export function activate(context: vscode.ExtensionContext) {

  var sessionManager = new SessionManager(context);
  sessionManager.start();

}

// this method is called when your extension is deactivated
export function deactivate() {
}

