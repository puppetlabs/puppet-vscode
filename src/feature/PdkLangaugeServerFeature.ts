import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { reporter } from '../telemetry/telemetry';
import { ConnectionHandler } from '../handler';
import { ConnectionStatus } from '../interfaces';
import { RequestType } from 'vscode-languageclient';
import { IAggregateConfiguration } from '../configuration';

export class PdkLanguageServerFeature implements IFeature {
  private terminal: vscode.Terminal;

  constructor(
    public handler: ConnectionHandler,
    public logger: ILogger,
    public ctx: vscode.ExtensionContext,
    public settings: IAggregateConfiguration
  ) {
    [
      { id: 'puppet.pdkNewClass', request: 'pdk/newClass', type: 'class' },
      { id: 'puppet.pdkNewDefinedType', request: 'pdk/newDefinedType', type: 'type' },
      { id: 'puppet.pdkNewTask', request: 'pdk/newTask', type: 'task' }
    ].forEach(command => {
      logger.debug(`Registered ${command.id} command`);
      ctx.subscriptions.push(
        vscode.commands.registerCommand(command.id, () => {
          if (this.handler.status !== ConnectionStatus.RunningLoaded) {
            vscode.window.showInformationMessage('PDK Commands are not available as the Language Server is not ready');
            return Promise.resolve();
          }

          let nameOpts: vscode.QuickPickOptions = {
            placeHolder: `Enter a name for the new Puppet ${command.type}`,
            matchOnDescription: true,
            matchOnDetail: true
          };

          vscode.window.showInputBox(nameOpts).then(async name => {
            if (name === undefined) {
              vscode.window.showWarningMessage(`No ${command.type} value specifed. Exiting.`);
              return;
            }

            vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `Creating Puppet ${command.type} - ${name}`,
                cancellable: false
              },
              async progress => {
                let targetFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                let requestParams = new PdkRequest(name, targetFolder);

                await this.executeCommand(command, requestParams, progress);
              }
            );
          });
        })
      );
    });
  }

  private async executeCommand(
    command: { id: string; request: string; type: string },
    requestParams: PdkRequestParams,
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ) {
    await this.handler.languageClient
      .sendRequest(new RequestType<PdkRequest, PdkResponse, void, void>(command.request), requestParams)
      .then(async result => {
        progress.report({ increment: 50 });
        if (result.error) {
          this.logger.error(result.error);
          vscode.window.showErrorMessage(result.error);
          return Promise.resolve();
        } else {
          if (reporter) {
            reporter.sendTelemetryEvent(command.id, { pdkVersion: this.settings.ruby.pdkVersion });
          }
        }
        let fileOne = result.files[0];
        await this.openFile(fileOne, false);
        if (result.files.length > 1) {
          for (let index = 1; index < result.files.length; index++) {
            let file = result.files[index];
            this.openFile(file, true);
          }
        }
        progress.report({ increment: 100 });
      });
  }

  private async openFile(file: string, preserveFocus: boolean) {
    await vscode.workspace.openTextDocument(vscode.Uri.file(file)).then(async doc => {
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.One, preserveFocus);
    });
  }

  public dispose(): any {
    this.terminal.dispose();
  }
}

export interface PdkRequestParams {
  name: string;
  targetdir: string;
}

export class PdkRequest implements PdkRequestParams {
  constructor(public name: string, public targetdir: string) {}
}

export interface PdkResponse {
  files: string[];
  data: string;
  error: string;
}
