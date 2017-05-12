'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as net from 'net';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

import { puppetResourceCommand } from '../src/commands/puppetResourceCommand';
import { puppetModuleCommand } from '../src/commands/puppetModuleCommand';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, ErrorAction, ErrorHandler, CloseAction, TransportKind } from 'vscode-languageclient';

function startLangServerTCP(host: string, addr: number, documentSelector: string | string[]): vscode.Disposable {
  let serverOptions: ServerOptions = function() {
    return new Promise((resolve, reject) => {
      var client = new net.Socket();
      client.connect(addr, host, function() {
        resolve({
          reader: client,
          writer: client
        });
      });
      client.on('error', function(err) {
        console.log(`[Puppet Lang Server Client] #{err}`);
      })

    });
  }

  let clientOptions: LanguageClientOptions = {
    // Register the server for puppet manifests
    documentSelector: ['puppet'],
    // synchronize: {
    //   // Synchronize the setting section 'languageServerExample' to the server
    //   configurationSection: 'languageServerExample',
    //   // Notify the server about file changes to '.clientrc files contain in the workspace
    //   fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
    // }
  }

  return new LanguageClient(`tcp lang server (host ${host} port ${addr})`, serverOptions, clientOptions).start();
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-puppet" is now active!');

  let resourceCommand = new puppetResourceCommand();
  var rdisposable = vscode.commands.registerCommand('extension.puppetResource', () => {
    
    resourceCommand.run();
  });
  context.subscriptions.push(resourceCommand);
  context.subscriptions.push(rdisposable);

  let moduleCommand = new puppetModuleCommand();
  var rdisposable = vscode.commands.registerCommand('extension.puppetModule', () => {
    
    moduleCommand.listModules();
  });
  context.subscriptions.push(moduleCommand);
  context.subscriptions.push(rdisposable);

  // TCP Language Server
  context.subscriptions.push(startLangServerTCP('127.0.0.1', 8081, ["puppet"]));
}

// this method is called when your extension is deactivated
export function deactivate() {
}
