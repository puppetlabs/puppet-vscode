'use strict';

import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { ConnectionStatus } from '../interfaces';
import * as messages from '../messages';
import { ConnectionHandler } from '../handler';
import { IAggregateConfiguration } from '../configuration';

class RequestParams implements messages.PuppetFixDiagnosticErrorsRequestParams {
  documentUri: string;
  alwaysReturnContent: boolean;
}

class FormatDocumentProvider {
  private connectionHandler: ConnectionHandler = undefined;

  constructor(connectionManager: ConnectionHandler) {
    this.connectionHandler = connectionManager;
  }

  public async formatTextEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
  ): Promise<vscode.TextEdit[]> {
    if (
      this.connectionHandler.status !== ConnectionStatus.RunningLoaded &&
      this.connectionHandler.status !== ConnectionStatus.RunningLoading
    ) {
      vscode.window.showInformationMessage('Please wait and try again. The Puppet extension is still loading...');
      return [];
    }

    const requestParams = new RequestParams();
    requestParams.documentUri = document.uri.toString(false);
    requestParams.alwaysReturnContent = false;

    const result = (await this.connectionHandler.languageClient.sendRequest(
      messages.PuppetFixDiagnosticErrorsRequest.type,
      requestParams,
    )) as messages.PuppetFixDiagnosticErrorsResponse;
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
    connectionManager: ConnectionHandler,
    config: IAggregateConfiguration,
    logger: ILogger,
    context: vscode.ExtensionContext,
  ) {
    this.provider = new FormatDocumentProvider(connectionManager);

    if (config.workspace.format.enable === true) {
      logger.debug('Registered Format Document provider');
      context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(langID, {
          provideDocumentFormattingEdits: (document, options, token) => {
            return this.provider.formatTextEdits(document, options);
          },
        }),
      );
    } else {
      logger.debug('Format Document provider has not been registered');
    }
  }

  public dispose(): any {
    return undefined;
  }
}
