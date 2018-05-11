'use strict';

import * as vscode from 'vscode';
import { ConnectionStatus } from '../../interfaces';
import { IConnectionManager } from '../../connection';
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import * as messages from '../../messages';

class RequestParams implements messages.PuppetResourceRequestParams {
  typename: string = "";
  title: string = "";
}

export class PuppetResourceCommand {
  private _connectionManager: IConnectionManager;
  private logger: ILogger;

  constructor(connMgr: IConnectionManager, logger: ILogger) {
    this._connectionManager = connMgr;
    this.logger = logger;
  }

  private pickPuppetResource(): Thenable<string | undefined> {
    let options: vscode.QuickPickOptions = {
      placeHolder: 'Enter a Puppet resource to interrogate',
      matchOnDescription: true,
      matchOnDetail: true
    };
    return vscode.window.showInputBox(options);
  }

  public run() {
    var thisCommand = this;

    if (thisCommand._connectionManager.status !== ConnectionStatus.Running) {
      vscode.window.showInformationMessage('Puppet Resource is not available as the Language Server is not ready');
      return;
    }

    this.pickPuppetResource().then(moduleName => {
      if (moduleName) {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        let doc = editor.document;
        let requestParams = new RequestParams();
        requestParams.typename = moduleName;

        thisCommand._connectionManager.languageClient
          .sendRequest(messages.PuppetResourceRequest.type, requestParams)
          .then(resourceResult => {
            if (resourceResult.error !== undefined && resourceResult.error.length > 0) {
              this.logger.error(resourceResult.error);
              return;
            }
            if (resourceResult.data === undefined || resourceResult.data.length === 0) {
              return;
            }

            if (!editor) {
              return;
            }

            var newPosition;
            if (editor.selection.isEmpty) {
              const position = editor.selection.active;
              newPosition = position.with(position.line, 0);
            } else {
              newPosition = new vscode.Position(0, 0);
            }

            this.editCurrentDocument(doc.uri, resourceResult.data, newPosition);
            if (reporter) {
              reporter.sendTelemetryEvent(messages.PuppetCommandStrings.PuppetResourceCommandId);
            }
          });
      }
    });
  }

  private editCurrentDocument(uri: vscode.Uri, text: string, position: vscode.Position) {
    let edit = new vscode.WorkspaceEdit();
    edit.insert(uri, position, text);
    vscode.workspace.applyEdit(edit);
  }

  public dispose(): any {}
}
