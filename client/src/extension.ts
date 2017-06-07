'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { startLangServerTCP, createLanguageServerProcess } from '../src/languageserver';
import { setupPuppetCommands } from '../src/puppetcommands';

const langID = 'puppet'; // don't change this
var statusBarItem;

export function activate(context: vscode.ExtensionContext) {
  var myOutputChannel = vscode.window.createOutputChannel('Puppet');
  myOutputChannel.show()

  try {
    var contextPath = context.asAbsolutePath(path.join('vendor', 'languageserver', 'puppet-languageserver'));

    let config = vscode.workspace.getConfiguration('puppet');

    var host             = config['languageserver']['address']; // '127.0.0.1';
    var port             = config['languageserver']['port']; // 8081;
    var stopOnClientExit = config['languageserver']['stopOnClientExit']; // true;
    var timeout          = config['languageserver']['timeout']; // 10;
    var preLoadPuppet    = config['languageserver']['preLoadPuppet']; // true;

    createStatusBarItem();

    var languageServerClient = null
    if (host == '127.0.0.1' || host == 'localhost' || host == '') {
      var serverProc = createLanguageServerProcess(contextPath, myOutputChannel);

      serverProc.stdout.on('data', (data) => {
        console.log("OUTPUT: " + data.toString());
        myOutputChannel.appendLine("OUTPUT: " + data.toString());

        languageServerClient = startLangServerTCP(host, port, langID, statusBarItem, myOutputChannel);
        context.subscriptions.push(languageServerClient.start());
      });

      serverProc.on('close', (exitCode) => {
        console.log("SERVER terminated with exit code: " + exitCode);
        myOutputChannel.appendLine("SERVER terminated with exit code: " + exitCode);
      });
    }
    else {
      languageServerClient = startLangServerTCP(host, port, langID, statusBarItem, myOutputChannel);
      context.subscriptions.push(languageServerClient.start());
    }

    setupPuppetCommands(langID, languageServerClient, context);

    console.log('Congratulations, your extension "vscode-puppet" is now active!');
    myOutputChannel.appendLine('Congratulations, your extension "vscode-puppet" is now active!');
  } catch (e) {
    console.log((<Error>e).message);//conversion to Error type
    myOutputChannel.appendLine((<Error>e).message);
  }
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
