'use strict';

import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { PDKCommandStrings } from '../messages';
import { reporter } from '../telemetry';

export class PDKFeature implements IFeature {
  private terminal: vscode.Terminal;

  constructor(context: vscode.ExtensionContext, logger: ILogger) {
    this.terminal = vscode.window.createTerminal('Puppet PDK');
    this.terminal.processId.then((pid) => {
      logger.debug('pdk shell started, pid: ' + pid);
    });
    context.subscriptions.push(this.terminal);

    context.subscriptions.push(
      vscode.commands.registerCommand(PDKCommandStrings.PdkNewModuleCommandId, () => {
        this.pdkNewModuleCommand();
      }),
    );
    logger.debug('Registered ' + PDKCommandStrings.PdkNewModuleCommandId + ' command');

    // commands that require no user input
    [
      { id: 'extension.pdkValidate', request: 'pdk validate', type: 'validate' },
      { id: 'extension.pdkTestUnit', request: 'pdk test unit', type: 'test' },
    ].forEach((command) => {
      context.subscriptions.push(
        vscode.commands.registerCommand(command.id, () => {
          this.terminal.sendText(command.request);
          this.terminal.show();
          if (reporter) {
            reporter.sendTelemetryEvent(command.id);
          }
        }),
      );
      logger.debug(`Registered ${command.id} command`);
    });

    // commands that require user input
    [
      { id: 'extension.pdkNewClass', request: 'pdk new class', type: 'Puppet class' },
      { id: 'extension.pdkNewTask', request: 'pdk new task', type: 'Bolt task' },
      { id: 'extension.pdkNewDefinedType', request: 'pdk new defined_type', type: 'Puppet defined_type' },
    ].forEach((command) => {
      context.subscriptions.push(
        vscode.commands.registerCommand(command.id, () => {
          const nameOpts: vscode.QuickPickOptions = {
            placeHolder: `Enter a name for the new ${command.type}`,
            matchOnDescription: true,
            matchOnDetail: true,
          };

          vscode.window.showInputBox(nameOpts).then((name) => {
            if (name === undefined) {
              vscode.window.showWarningMessage(`No ${command.type} value specifed. Exiting.`);
              return;
            }
            const request = `${command.request} ${name}`;
            this.terminal.sendText(request);
            this.terminal.show();
            if (reporter) {
              reporter.sendTelemetryEvent(command.id);
            }
          });
        }),
      );
      logger.debug(`Registered ${command.id} command`);
    });
  }

  public dispose(): void {
    this.terminal.dispose();
  }

  private pdkNewModuleCommand(): void {
    const nameOpts: vscode.QuickPickOptions = {
      placeHolder: 'Enter a name for the new Puppet module',
      matchOnDescription: true,
      matchOnDetail: true,
    };
    const dirOpts: vscode.QuickPickOptions = {
      placeHolder: 'Enter a path for the new Puppet module',
      matchOnDescription: true,
      matchOnDetail: true,
    };

    vscode.window.showInputBox(nameOpts).then((moduleName) => {
      if (moduleName === undefined) {
        vscode.window.showWarningMessage('No module name specifed. Exiting.');
        return;
      }
      vscode.window.showInputBox(dirOpts).then((dir) => {
        this.terminal.sendText(`pdk new module --skip-interview ${moduleName} ${dir}`);
        this.terminal.sendText(`code ${dir}`);
        this.terminal.show();
        if (reporter) {
          reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewModuleCommandId);
        }
      });
    });
  }
}
