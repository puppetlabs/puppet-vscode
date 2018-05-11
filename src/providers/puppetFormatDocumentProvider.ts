'use strict';

import * as vscode from 'vscode';
import { ConnectionStatus } from '../interfaces';
import { IConnectionManager } from '../connection';
import * as messages from '../messages';

class RequestParams implements messages.PuppetFixDiagnosticErrorsRequestParams {
  documentUri: string = "";
  alwaysReturnContent: boolean = false;
}

export function PuppetFormatDocumentProvider(
  document: vscode.TextDocument,
  options: vscode.FormattingOptions,
  connMgr: IConnectionManager
): Thenable<vscode.TextEdit[]> {
  if (connMgr.status !== ConnectionStatus.Running) {
    vscode.window.showInformationMessage(
      'Formatting Puppet files is not available as the Language Server is not ready'
    );
    return new Promise(resolve => {
      resolve([]);
    });
  }

  let requestParams = new RequestParams();
  requestParams.documentUri = document.uri.toString(false);
  requestParams.alwaysReturnContent = false;

  return connMgr.languageClient
    .sendRequest(messages.PuppetFixDiagnosticErrorsRequest.type, requestParams)
    .then(result => {
      result = result as messages.PuppetFixDiagnosticErrorsResponse;
      if (result.fixesApplied > 0 && result.newContent !== null) {
        return [vscode.TextEdit.replace(new vscode.Range(0, 0, document.lineCount, 0), result.newContent)];
      } else {
        return [];
      }
    });
}
