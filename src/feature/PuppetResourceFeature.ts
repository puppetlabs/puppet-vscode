'use strict';

import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import {
  PuppetCommandStrings,
  PuppetResourceRequestParams,
  PuppetResourceRequest,
  PuppetResourceResponse,
} from '../messages';
import { reporter } from '../telemetry';
import { ConnectionStatus } from '../interfaces';
import { ConnectionHandler } from '../handler';
import { ISettings, SettingsFromWorkspace } from '../settings';

export class PuppetResourceFeature implements IFeature {
  private _connectionHandler: ConnectionHandler;
  private logger: ILogger;

  dispose() {}

  constructor(context: vscode.ExtensionContext, connMgr: ConnectionHandler, logger: ILogger) {
    this.logger = logger;
    this._connectionHandler = connMgr;
    context.subscriptions.push(
      vscode.commands.registerCommand(PuppetCommandStrings.PuppetResourceCommandId, () => {
        this.run();
      }),
    );
  }
  public run() {
    var thisCommand = this;

    if (thisCommand._connectionHandler.status !== ConnectionStatus.RunningLoaded) {
      vscode.window.showInformationMessage('Puppet Resource is not available as the Language Server is not ready');
      return;
    }

    this.pickPuppetResource().then((moduleName) => {
      if (moduleName) {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        let doc = editor.document;
        let requestParams = new RequestParams();
        requestParams.typename = moduleName;

        // Calculate where the progress message should go, if at all.
        const currentSettings: ISettings = SettingsFromWorkspace();
        var notificationType = vscode.ProgressLocation.Notification;
        if (currentSettings.notification !== undefined && currentSettings.notification.puppetResource !== undefined) {
          switch (currentSettings.notification.puppetResource.toLowerCase()) {
            case 'messagebox':
              notificationType = vscode.ProgressLocation.Notification;
              break;
            case 'statusbar':
              notificationType = vscode.ProgressLocation.Window;
              break;
            case 'none':
              notificationType = undefined;
              break;
            default:
              break; // Default is already set
          }
        }

        if (notificationType !== undefined) {
          vscode.window.withProgress(
            {
              location: notificationType,
              title: 'Puppet',
              cancellable: false,
            },
            (progress) => {
              progress.report({ message: `Gathering Puppet ${moduleName} Resources` });
              return thisCommand._connectionHandler.languageClient
                .sendRequest(PuppetResourceRequest.type, requestParams)
                .then((resourceResult) => {
                  this.respsonseToVSCodeEdit(resourceResult, editor, doc);
                });
            },
          );
        } else {
          thisCommand._connectionHandler.languageClient
            .sendRequest(PuppetResourceRequest.type, requestParams)
            .then((resourceResult) => {
              this.respsonseToVSCodeEdit(resourceResult, editor, doc);
            });
        }
      }
    });
  }

  private respsonseToVSCodeEdit(
    resourceResult: PuppetResourceResponse,
    editor: vscode.TextEditor,
    doc: vscode.TextDocument,
  ) {
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

    var newPosition = new vscode.Position(0, 0);
    if (editor.selection.isEmpty) {
      const position = editor.selection.active;
      newPosition = position.with(position.line, 0);
    }

    this.editCurrentDocument(doc.uri, resourceResult.data, newPosition);
    if (reporter) {
      reporter.sendTelemetryEvent(PuppetCommandStrings.PuppetResourceCommandId);
    }
  }

  private pickPuppetResource(): Thenable<string | undefined> {
    let options: vscode.QuickPickOptions = {
      placeHolder: 'Enter a Puppet resource to interrogate',
      matchOnDescription: true,
      matchOnDetail: true,
    };
    return vscode.window.showInputBox(options);
  }

  private editCurrentDocument(uri: vscode.Uri, text: string, position: vscode.Position) {
    let edit = new vscode.WorkspaceEdit();
    edit.insert(uri, position, text);
    vscode.workspace.applyEdit(edit);
  }
}

class RequestParams implements PuppetResourceRequestParams {
  // tslint complains that these properties have 'no initializer and is not definitely assigned in the constructor.'
  // following any of the fixes suggested breaks the language server, so disabling the rule here
  //  and will make a ticket to work on this with lang server
  typename: string; // tslint:disable-line
  title: string; // tslint:disable-line
}
