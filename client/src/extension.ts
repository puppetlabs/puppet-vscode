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

import { PuppetNodeGraphContentProvider, isNodeGraphFile, getNodeGraphUri } from '../src/providers/previewNodeGraphProvider';
import { puppetResourceCommand } from '../src/commands/puppetResourceCommand';
import { puppetModuleCommand } from '../src/commands/puppetModuleCommand';
import * as messages from '../src/messages';

var statusBarItem;
var languageServerClient: LanguageClient = undefined;

var host = '127.0.0.1';
var port = 8081;
var title = `tcp lang server (host ${host} port ${port})`;
var langID = 'puppet';

function startLangServerTCP(host: string, addr: number, documentSelector: string | string[]): vscode.Disposable {
  let serverOptions: ServerOptions = function () {
    return new Promise((resolve, reject) => {
      var client = new net.Socket();
      client.connect(addr, host, function () {
        resolve({ reader: client, writer: client });
      });
      client.on('error', function (err) {
        console.log(`[Puppet Lang Server Client] #{err}`);
      })
    });
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: [langID],
  }

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

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-puppet" is now active!');

  createStatusBarItem();

  context.subscriptions.push(startLangServerTCP(host, port, [langID]));

  let resourceCommand = new puppetResourceCommand();
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
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// Status Bar handler
export function createStatusBarItem() {
  if (statusBarItem === undefined) {
    // Create the status bar item and place it right next
    // to the language indicator
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);

    //this.statusBarItem.command = this.ShowSessionMenuCommandName;
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

function showNodeGraph(uri?: vscode.Uri, sideBySide: boolean = false) {
  let resource = uri;
  if (!(resource instanceof vscode.Uri)) {
    if (vscode.window.activeTextEditor) {
      // we are relaxed and don't check for puppet files
      // TODO: Should we? Probably
      resource = vscode.window.activeTextEditor.document.uri;
    }
  }

  const thenable = vscode.commands.executeCommand('vscode.previewHtml',
    getNodeGraphUri(resource),
    getViewColumn(sideBySide),
    `Node Graph '${path.basename(resource.fsPath)}'`);

  return thenable;
}

function getViewColumn(sideBySide: boolean): vscode.ViewColumn | undefined {
  const active = vscode.window.activeTextEditor;
  if (!active) {
    return vscode.ViewColumn.One;
  }

  if (!sideBySide) {
    return active.viewColumn;
  }

  switch (active.viewColumn) {
    case vscode.ViewColumn.One:
      return vscode.ViewColumn.Two;
    case vscode.ViewColumn.Two:
      return vscode.ViewColumn.Three;
  }

  return active.viewColumn;
}
