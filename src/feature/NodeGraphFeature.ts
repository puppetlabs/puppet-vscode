'use strict';

import * as vscode from "vscode";
import * as path from 'path';

import { IFeature } from "../feature";
import { ILogger } from "../logging";
import { IConnectionManager } from '../connection';

const PuppetNodeGraphToTheSideCommandId: string = 'extension.puppetShowNodeGraphToSide';

class NodeGraphWebViewProvider implements vscode.Disposable {
  private connectionManager: IConnectionManager = undefined;
  private docUri: vscode.Uri = undefined;
  private webPanel: vscode.WebviewPanel = undefined;
  private parentFeature: NodeGraphFeature = undefined;

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
      { }
    );

    this.webPanel.onDidDispose( () => {
      this.parentFeature.onProviderWebPanelDisposed(this);
    });

    this.update();
  }

  public update(): void {
    this.webPanel.webview.html = this.getHTMLContent();
  }

  public getHTMLContent(): string {
    return '<html><body>Node Graph Preview - ' + (new Date().toUTCString()) + '</body></html>';
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
        if (item.isSameUri(document.uri)) { item.update(); }
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
