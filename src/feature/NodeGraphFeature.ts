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

class NodeGraphWebViewProvider implements vscode.Disposable {
  private connectionManager: IConnectionManager = undefined;
  private docUri: vscode.Uri = undefined;
  private webPanel: vscode.WebviewPanel = undefined;
  private parentFeature: NodeGraphFeature = undefined;
  private shownLanguageServerNotAvailable = false;

  constructor(
    documentUri:vscode.Uri,
    connectionManager:IConnectionManager,
    parent: NodeGraphFeature)
  {
    this.docUri = documentUri;
    this.connectionManager = connectionManager;
    this.parentFeature = parent;
  }

  public isSameUri(value: vscode.Uri): boolean {
    return value.toString() === this.docUri.toString();
  }

  public show(): void {
    if (this.webPanel !== undefined) { return; }
    this.webPanel = vscode.window.createWebviewPanel(
      'nodeGraph',                                         // Identifies the type of the webview. Used internally
      `Node Graph '${path.basename(this.docUri.fsPath)}'`, // Title of the panel displayed to the user
      vscode.ViewColumn.Beside,                            // Editor column to show the new webview panel in.
      { enableScripts: true }
    );

    this.webPanel.onDidDispose( () => {
      this.parentFeature.onProviderWebPanelDisposed(this);
    });

    this.updateAsync();
  }

  public async updateAsync(): Promise<void> {
    this.webPanel.webview.html = await this.getHTMLContent();
  }

  public async getHTMLContent(): Promise<string> {
    if ((this.connectionManager.status !== ConnectionStatus.RunningLoaded) && (this.connectionManager.status !== ConnectionStatus.RunningLoading)) {
      if (this.shownLanguageServerNotAvailable) {
        vscode.window.showInformationMessage("The Puppet Node Graph Preview is not available as the Editor Service is not ready");
        this.shownLanguageServerNotAvailable = true;
      }
      return "The Puppet Node Graph Preview is not available as the Editor Service is not ready";
    }

    // Use the language server to render the document
    const requestData = {
      external: this.docUri.toString()
    };
    return this.connectionManager.languageClient
      .sendRequest(CompileNodeGraphRequest.type, requestData)
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
          graphContent = graphContent.replace(`label = "editorservices"`,styling);

          svgContent = viz(graphContent,"svg");
        }

        var errorContent = `<div style='font-size: 1.5em'>${compileResult.error}</div>`;
        if ((compileResult.error === undefined) || (compileResult.error === null)) { errorContent = ''; }

        if (reporter) {
          reporter.sendTelemetryEvent(PuppetNodeGraphToTheSideCommandId);
        }

        const html: string = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    g.node path {
      fill: var(--vscode-button-background);
      stroke: var(--vscode-button-hoverBackground);
    }
    g.node text {
      fill: var(--vscode-button-foreground);
    }
    g.edge path {
      fill: none;
      stroke: var(--vscode-foreground);
    }
    g.edge polygon {
      fill: var(--vscode-foreground);
      stroke: var(--vscode-foreground);
    }
  </style>
</head>
<body>
${errorContent}
<div id="graphviz_svg_div">
${svgContent}
</div>
</body></html>`;

        return html;
    });
  }

  public dispose(): any {
    this.webPanel.dispose();
    return undefined;
  }
}

export class NodeGraphFeature implements IFeature {
  private acceptedLangId: string = undefined;
  private providers: NodeGraphWebViewProvider[] = undefined;
  private connectionManager: IConnectionManager = undefined;

  public onProviderWebPanelDisposed(provider: NodeGraphWebViewProvider): void {
    // If the panel gets disposed then the user closed the tab.
    // Remove the provider object and dispose of it.
    const index = this.providers.indexOf(provider, 0);
    if (index > -1) {
      this.providers.splice(index, 1);
      provider.dispose();
    }
  }

  constructor(
    langID: string,
    connectionManager: IConnectionManager,
    logger: ILogger,
    context: vscode.ExtensionContext
  ) {
    this.acceptedLangId = langID;
    this.providers = [];
    this.connectionManager = connectionManager;

    context.subscriptions.push(vscode.commands.registerCommand(PuppetNodeGraphToTheSideCommandId,
      () => {
        if (!vscode.window.activeTextEditor) { return; }
        if (vscode.window.activeTextEditor.document.languageId !== this.acceptedLangId) { return; }

        let resource = vscode.window.activeTextEditor.document.uri;
        let provider = new NodeGraphWebViewProvider(resource, this.connectionManager, this);
        this.providers.push(provider);
        provider.show();
      }
    ));
    logger.debug("Registered " + PuppetNodeGraphToTheSideCommandId + " command");

    // Subscribe to save events and fire updates
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
      this.providers.forEach( (item) => {
        if (item.isSameUri(document.uri)) { item.updateAsync(); }
      });
    }));
    logger.debug("Registered onDidSaveTextDocument for node graph event handler");
  }

  public dispose(): any {
    // Dispose of any providers and then clear any references to them
    this.providers.forEach( (item) => { item.dispose(); });
    this.providers = [];
    return undefined;
  }
}
