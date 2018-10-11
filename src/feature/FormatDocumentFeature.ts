'use strict';

import * as vscode from "vscode";
import { IFeature } from "../feature";
import { ILogger } from "../logging";
import { IConnectionManager } from '../connection';
import { ConnectionStatus } from '../interfaces';
import { ISettings } from '../settings';
import * as messages from '../messages';

class RequestParams implements messages.PuppetFixDiagnosticErrorsRequestParams {
  documentUri: string;
  alwaysReturnContent: boolean;
}

class FormatDocumentProvider {
  private connectionManager: IConnectionManager = undefined;

  constructor(connectionManager: IConnectionManager) {
    this.connectionManager = connectionManager;
  }

  public async formatTextEdits(document: vscode.TextDocument, options: vscode.FormattingOptions): Promise<vscode.TextEdit[]> {
    if (this.connectionManager.status !== ConnectionStatus.Running) {
      vscode.window.showInformationMessage("Please wait and try again. The Puppet extension is still loading...");
      return [];
    }

    let requestParams = new RequestParams;
    requestParams.documentUri = document.uri.toString(false);
    requestParams.alwaysReturnContent = false;

    const result = await this.connectionManager
                             .languageClient
                             .sendRequest(messages.PuppetFixDiagnosticErrorsRequest.type, requestParams) as messages.PuppetFixDiagnosticErrorsResponse;
    if (result.fixesApplied > 0 && result.newContent !== undefined) {
      return [vscode.TextEdit.replace(new vscode.Range(0, 0, document.lineCount, 0), result.newContent)];
    }
    return [];
  }
}

export class FormatDocumentFeature implements IFeature {
  private provider: FormatDocumentProvider;

  constructor(
    langID: string,
    connectionManager: IConnectionManager,
    settings: ISettings,
    logger: ILogger,
    context: vscode.ExtensionContext
  ) {
    this.provider = new FormatDocumentProvider(connectionManager);

    if (settings.format.enable === true) {
      logger.debug("Registered Format Document provider");
      context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(langID, {
        provideDocumentFormattingEdits: (document, options, token) => { return this.provider.formatTextEdits(document, options); }
      }
      ));
    } else {
      logger.debug("Format Document provider has not been registered");
    }
  }

  public dispose(): any { return undefined; }
}
