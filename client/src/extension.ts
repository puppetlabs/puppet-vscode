'use strict';

import * as vscode from 'vscode';

import { startLangServerTCP } from '../src/languageserver';
import { setupPuppetCommands } from '../src/puppetcommands';

const langID = 'puppet'; // don't change this
var statusBarItem;

export function activate(context: vscode.ExtensionContext) {
  let config = vscode.workspace.getConfiguration('puppet');

  var host             = config['languageserver']['address']; // '127.0.0.1';
  var port             = config['languageserver']['port']; // 8081;
  var stopOnClientExit = config['languageserver']['stopOnClientExit']; // true;
  var timeout          = config['languageserver']['timeout']; // 8081;
  var preLoadPuppet    = config['languageserver']['preLoadPuppet']; // true;

  createStatusBarItem();

  var languageServerClient = startLangServerTCP(host, port, langID, statusBarItem);
  context.subscriptions.push(languageServerClient.start());

  setupPuppetCommands(langID, languageServerClient, context);

  console.log('Congratulations, your extension "vscode-puppet" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// Status Bar handler
export function createStatusBarItem() {
  if (statusBarItem === undefined) {
    // Create the status bar item and place it right next to the language indicator
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    statusBarItem.show();
    vscode.window.onDidChangeActiveTextEditor(textEditor => {
      if (textEditor === undefined || textEditor.document.languageId !== "puppet") {
        statusBarItem.hide();
      }
      else {
        statusBarItem.show();
      }
    })
  }
}

