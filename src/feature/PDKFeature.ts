'use strict';

import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { reporter } from '../telemetry/telemetry';
import { IAggregateConfiguration } from '../configuration';

export class PDKFeature implements IFeature {
  private terminal: vscode.Terminal;

  constructor(context: vscode.ExtensionContext, logger: ILogger, settings: IAggregateConfiguration) {
    this.terminal = vscode.window.createTerminal('Puppet PDK');
    this.terminal.processId.then(pid => {
      logger.debug('pdk shell started, pid: ' + pid);
    });
    context.subscriptions.push(this.terminal);

    context.subscriptions.push(
      vscode.commands.registerCommand('puppet.pdkNewModule', () => {
        this.pdkNewModuleCommand();
      })
    );
    logger.debug('Registered ' + 'puppet.pdkNewModule' + ' command');

    [
      { id: 'puppet.pdkValidate', request: 'pdk validate', type: 'validate' },
      { id: 'puppet.pdkTestUnit', request: 'pdk test unit', type: 'test' }
    ].forEach(command => {
      context.subscriptions.push(
        vscode.commands.registerCommand(command.id, () => {
          this.terminal.sendText(command.request);
          this.terminal.show();
          if (reporter) {
            reporter.sendTelemetryEvent(command.id, { pdkVersion: settings.ruby.pdkVersion });
          }
        })
      );
      logger.debug(`Registered ${command.id} command`);
    });
  }

  public dispose(): any {
    this.terminal.dispose();
  }

  private pdkNewModuleCommand() {
    let nameOpts: vscode.QuickPickOptions = {
      placeHolder: 'Enter a name for the new Puppet module',
      matchOnDescription: true,
      matchOnDetail: true
    };
    let dirOpts: vscode.QuickPickOptions = {
      placeHolder: 'Enter a path for the new Puppet module. Leave this empy to use the current open directory',
      matchOnDescription: true,
      matchOnDetail: true
    };

    vscode.window.showInputBox(nameOpts).then(moduleName => {
      if (moduleName === undefined) {
        vscode.window.showWarningMessage('No module name specifed. Exiting.');
        return;
      }
      vscode.window.showInputBox(dirOpts).then(targetFolder => {
        if (targetFolder === undefined) {
          targetFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        this.terminal.sendText(`pdk new module --skip-interview ${moduleName} ${targetFolder}`);
        this.terminal.sendText(`code ${targetFolder}`);
        this.terminal.show();
        if (reporter) {
          reporter.sendTelemetryEvent('puppet.pdkNewModule', { pdkVersion: settings.ruby.pdkVersion });
        }
      });
    });
  }
}
