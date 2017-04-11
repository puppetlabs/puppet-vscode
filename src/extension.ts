'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

import { puppetLintCommand } from '../src/commands/puppetLintCommand';
import { puppetResourceCommand } from '../src/commands/puppetResourceCommand';
import { puppetLintProvider } from '../src/providers/puppetLintProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-puppet" is now active!');

  let linter = new puppetLintProvider();
  linter.activate(context.subscriptions);


  let lintCommand = new puppetLintCommand();
  var ldisposable = vscode.commands.registerCommand('extension.puppetLint', () => {
    lintCommand.fixDocument();
  });
  context.subscriptions.push(lintCommand);
  context.subscriptions.push(ldisposable);

  let resourceCommand = new puppetResourceCommand();
  var rdisposable = vscode.commands.registerCommand('extension.puppetResource', () => {
    
    resourceCommand.run();
  });
  context.subscriptions.push(resourceCommand);
  context.subscriptions.push(rdisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
