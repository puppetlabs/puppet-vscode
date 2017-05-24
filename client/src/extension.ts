'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as net from 'net';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;
import {
  LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions,
  ErrorAction, ErrorHandler, CloseAction, TransportKind, RequestType0
} from 'vscode-languageclient';

import {
  PuppetNodeGraphContentProvider, isNodeGraphFile, getNodeGraphUri,
  showNodeGraph, getViewColumn
} from '../src/providers/previewNodeGraphProvider';
import { puppetResourceCommand } from '../src/commands/puppetResourceCommand';
import { puppetModuleCommand } from '../src/commands/puppetModuleCommand';
import * as messages from '../src/messages';

const langID = 'puppet';
var statusBarItem;
var languageServerClient: LanguageClient = undefined;

export function activate(context: vscode.ExtensionContext) {
  let config = vscode.workspace.getConfiguration('puppet');

  var host             = config['languageserver']['address']; // '127.0.0.1';
  var port             = config['languageserver']['port']; // 8081;
  var stopOnClientExit = config['languageserver']['stopOnClientExit']; // true;
  var timeout          = config['languageserver']['timeout']; // 8081;
  var preLoadPuppet    = config['languageserver']['preLoadPuppet']; // true;

  createStatusBarItem();

  context.subscriptions.push(startLangServerTCP(host, port, langID, [langID]));

  let resourceCommand = new puppetResourceCommand(languageServerClient);
  context.subscriptions.push(resourceCommand);
  context.subscriptions.push(vscode.commands.registerCommand('extension.puppetResource', () => {
    resourceCommand.run();
  }));

  let moduleCommand = new puppetModuleCommand();
  context.subscriptions.push(moduleCommand);
  context.subscriptions.push(vscode.commands.registerCommand('extension.puppetModule', () => {
    moduleCommand.listModules();
  }));

  context.subscriptions.push(vscode.commands.registerCommand(
    'extension.puppetShowNodeGraphToSide',
    uri => showNodeGraph(uri, true))
  );

  const contentProvider = new PuppetNodeGraphContentProvider(context, languageServerClient);
  const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(langID, contentProvider);

  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
    if (isNodeGraphFile(document)) {
      const uri = getNodeGraphUri(document.uri);
      contentProvider.update(uri);
    }
  }));

  console.log('Congratulations, your extension "vscode-puppet" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function startLangServerTCP(host: string, port: number, langID: string, documentSelector: string | string[]): vscode.Disposable {
  let serverOptions: ServerOptions = function () {
    return new Promise((resolve, reject) => {
      var client = new net.Socket();
      client.connect(port, host, function () {
        resolve({ reader: client, writer: client });
      });
      client.on('error', function (err) {
        console.log(`[Puppet Lang Server Client] ` + err);
      })
    });
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: [langID],
  }

  var title = `tcp lang server (host ${host} port ${port})`;
  languageServerClient = new LanguageClient(title, serverOptions, clientOptions)
  languageServerClient.onReady().then(() => {
    languageServerClient.sendRequest(messages.PuppetVersionRequest.type).then((versionDetails) => {
      statusBarItem.color = "#affc74";
      statusBarItem.text = "$(terminal) " + versionDetails.puppetVersion;
    });
  }, (reason) => {
    this.setSessionFailure("Could not start language service: ", reason);
  });

  return languageServerClient.start();
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

