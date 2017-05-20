'use strict';

import * as vscode from 'vscode';
import { LanguageClient, RequestType } from 'vscode-languageclient';
import { PuppetResourceRequestParams, PuppetResourceRequest } from '../messages';

class RequestParams implements PuppetResourceRequestParams {
  typename: string;
  title: string;
}

export class puppetResourceCommand {
  private _langServer: LanguageClient = undefined;

  constructor(
    private langServer: LanguageClient
  ) {
    this._langServer = langServer;
  }

  private pickPuppetResource(): Thenable<string> {
    let options: vscode.QuickPickOptions = {
      placeHolder: "Enter a Puppet resource to interrogate",
      matchOnDescription: true,
      matchOnDetail: true
    };
    return vscode.window.showInputBox(options);
  }

  public run() {
    this.pickPuppetResource().then((moduleName) => {
      if (moduleName) {

        let editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        let doc = editor.document;
        let requestParams = new RequestParams;
        requestParams.typename = moduleName;

        this._langServer
          .sendRequest(PuppetResourceRequest.type, requestParams)
          .then( (resourceResult) => {
            if (resourceResult.error != undefined && resourceResult.error.length > 0) {
            // TODO Log any errors
              console.error(resourceResult.error);
              return;
            }
            if (resourceResult.data == undefined || resourceResult.data.length == 0) return;

            if (editor.selection.isEmpty) {
              const position = editor.selection.active;
              var newPosition = position.with(position.line, 0);
            }else{
              var newPosition = new vscode.Position(0, 0);
            }

            this.editCurrentDocument(doc.uri, resourceResult.data, newPosition);
          });
      }
    });
  }

  private editCurrentDocument(uri, text, position) {
    let edit = new vscode.WorkspaceEdit();
    edit.insert(uri, position, text);
    vscode.workspace.applyEdit(edit);
  }

  public dispose(): any {
  }
}
