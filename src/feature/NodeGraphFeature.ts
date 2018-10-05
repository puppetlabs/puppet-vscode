'use strict';

import * as vscode from "vscode";
import * as path from 'path';

import { IFeature } from "../feature";
import { ILogger } from "../logging";
import { IConnectionManager } from '../connection';
import { ConnectionStatus } from '../interfaces';
import { CompileNodeGraphRequest } from '../messages';
import { reporter } from '../telemetry/telemetry';
import * as viz from 'viz.js';

const PuppetNodeGraphToTheSideCommandId: string = 'extension.puppetShowNodeGraphToSide';

class NodeGraphContentProvider implements vscode.TextDocumentContentProvider {
  private onDidChangeEvent = new vscode.EventEmitter<vscode.Uri>();
  private waiting: boolean = false;
  private connectionManager: IConnectionManager = undefined;
  private shownLanguageServerNotAvailable = false;

  constructor(connectionManager:IConnectionManager) {
    this.connectionManager = connectionManager;
  }

  public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
    const sourceUri = vscode.Uri.parse(uri.query);

    return vscode.workspace.openTextDocument(sourceUri).then(document => {
      const initialData = {
        previewUri: uri.toString(),
        source: sourceUri.toString()
      };

      if ((this.connectionManager.status !== ConnectionStatus.Running) && (this.connectionManager.status !== ConnectionStatus.Starting)) {
        if (this.shownLanguageServerNotAvailable) {
          vscode.window.showInformationMessage("The Puppet Node Graph Preview is not available as the Editor Service is not ready");
          this.shownLanguageServerNotAvailable = true;
        }
        return "The Puppet Node Graph Preview is not available as the Editor Service is not ready";
      }

      // Use the language server to render the document
      return this.connectionManager.languageClient
        .sendRequest(CompileNodeGraphRequest.type, sourceUri)
        .then(
          (compileResult) => {

          var svgContent = '';
          if (compileResult.dotContent !== null) {
            var styling = `
            bgcolor = "transparent"
            color = "white"
            rankdir = "TB"
            node [ shape="box" penwidth="2" color="#e0e0e0" style="rounded,filled" fontname="Courier New" fillcolor=black, fontcolor="white"]
            edge [ style="bold" color="#f0f0f0" penwith="2" ]

            label = ""`;

            var graphContent = compileResult.dotContent;
            if (graphContent === undefined) { graphContent = ''; }
            // vis.jz sees backslashes as escape characters, however they are not in the DOT language.  Instead
            // we should escape any backslash coming from a valid DOT file in preparation to be rendered
            graphContent = graphContent.replace(/\\/g,"\\\\");
            graphContent = graphContent.replace(`label = "vscode"`,styling);

            svgContent = viz(graphContent,"svg");
          }

          var errorContent = `<div style='font-size: 1.5em'>${compileResult.error}</div>`;
          if ((compileResult.error === undefined) || (compileResult.error === null)) { errorContent = ''; }

          if (reporter) {
            reporter.sendTelemetryEvent(PuppetNodeGraphToTheSideCommandId);
          }

          return `
            ${errorContent}
            <div id="graphviz_svg_div">
              ${svgContent}
            </div>`;
      });
    });
  }

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this.onDidChangeEvent.event;
  }

  public update(uri: vscode.Uri) {
    if (!this.waiting) {
      this.waiting = true;
      setTimeout(() => {
        this.waiting = false;
        this.onDidChangeEvent.fire(uri);
      }, 300);
    }
  }
}

export class NodeGraphFeature implements IFeature {
  private provider: NodeGraphContentProvider;

  constructor(
    langID: string,
    connectionManager: IConnectionManager,
    logger: ILogger,
    context: vscode.ExtensionContext
  ) {
    context.subscriptions.push(vscode.commands.registerCommand(PuppetNodeGraphToTheSideCommandId,
      uri => this.showNodeGraph(uri, true))
    );
    logger.debug("Registered " + PuppetNodeGraphToTheSideCommandId + " command");

    this.provider = new NodeGraphContentProvider(connectionManager);
    vscode.workspace.registerTextDocumentContentProvider(langID, this.provider);
    logger.debug("Registered Node Graph Text Document provider");
  
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
      if (this.isNodeGraphFile(document)) {
        const uri = this.getNodeGraphUri(document.uri);
        this.provider.update(uri);
      }
    }));
    logger.debug("Registered onDidSaveTextDocument for node graph event handler");
  }

  private isNodeGraphFile(document: vscode.TextDocument) {
    return document.languageId === 'puppet'
      && document.uri.scheme !== 'puppet'; // prevent processing of own documents
  }
  
  private getNodeGraphUri(uri: vscode.Uri) {
    if (uri.scheme === 'puppet') {
      return uri;
    }
  
    return uri.with({
      scheme: 'puppet',
      path: uri.fsPath + '.rendered',
      query: uri.toString()
    });
  }
  
  private getViewColumn(sideBySide: boolean): vscode.ViewColumn | undefined {
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

  private showNodeGraph(uri?: vscode.Uri, sideBySide: boolean = false) {
    let resource = uri;
    if (!(resource instanceof vscode.Uri)) {
      if (vscode.window.activeTextEditor) {
        // we are relaxed and don't check for puppet files
        // TODO: Should we? Probably
        resource = vscode.window.activeTextEditor.document.uri;
      }
    }
  
    const thenable = vscode.commands.executeCommand('vscode.previewHtml',
      this.getNodeGraphUri(resource),
      this.getViewColumn(sideBySide),
      `Node Graph '${path.basename(resource.fsPath)}'`);
  
    return thenable;
  }

  public dispose(): any { return undefined; }
}
