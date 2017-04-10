'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

import { PuppetConfig } from '../src/providers/PuppetConfig';
import { PuppetLintProvider } from '../src/providers/PuppetLintProvider';
import { PuppetLintController } from '../src/providers/PuppetLintController';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-puppet" is now active!');

  let lint = new PuppetLintProvider();;
  let pcontroller = new PuppetLintController(lint);
  context.subscriptions.push(pcontroller);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
