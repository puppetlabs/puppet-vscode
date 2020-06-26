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

    [
      { id: 'puppet.pdkValidate', request: 'pdk validate', type: 'validate' },
      { id: 'puppet.pdkTestUnit', request: 'pdk test unit', type: 'test' },
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

    context.subscriptions.push(
      vscode.commands.registerCommand(PDKCommandStrings.PdkNewClassCommandId, () => {
        this.pdkNewClassCommand();
      }),
    );
    logger.debug('Registered ' + PDKCommandStrings.PdkNewClassCommandId + ' command');
    context.subscriptions.push(
      vscode.commands.registerCommand(PDKCommandStrings.PdkNewTaskCommandId, () => {
        this.pdkNewTaskCommand();
      }),
    );
    logger.debug('Registered ' + PDKCommandStrings.PdkNewTaskCommandId + ' command');
    context.subscriptions.push(
      vscode.commands.registerCommand(PDKCommandStrings.PdkNewDefinedTypeCommandId, () => {
        this.pdkNewDefinedTypeCommand();
      }),
    );
    logger.debug('Registered ' + PDKCommandStrings.PdkNewTaskCommandId + ' command');
  }

  public dispose(): any {
    this.terminal.dispose();
  }

  private pdkNewModuleCommand() {
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

  private pdkNewClassCommand() {
    const nameOpts: vscode.QuickPickOptions = {
      placeHolder: 'Enter a name for the new Puppet class',
      matchOnDescription: true,
      matchOnDetail: true,
    };
    vscode.window.showInputBox(nameOpts).then((className) => {
      if (className === undefined) {
        vscode.window.showWarningMessage('No class name specifed. Exiting.');
        return;
      }
      this.terminal.sendText(`pdk new class ${className}`);
      this.terminal.show();
      if (reporter) {
        reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewClassCommandId);
      }
    });
  }

  private pdkNewTaskCommand() {
    const nameOpts: vscode.QuickPickOptions = {
      placeHolder: 'Enter a name for the new Puppet Task',
      matchOnDescription: true,
      matchOnDetail: true,
    };
    vscode.window.showInputBox(nameOpts).then((taskName) => {
      if (taskName === undefined) {
        vscode.window.showWarningMessage('No task name specifed. Exiting.');
        return;
      }
      this.terminal.sendText(`pdk new task ${taskName}`);
      this.terminal.show();
      if (reporter) {
        reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewTaskCommandId);
      }
    });
  }

  private pdkNewDefinedTypeCommand() {
    const nameOpts: vscode.QuickPickOptions = {
      placeHolder: 'Enter a name for the new Puppet defined type',
      matchOnDescription: true,
      matchOnDetail: true,
    };
    vscode.window.showInputBox(nameOpts).then((typeName) => {
      if (typeName === undefined) {
        vscode.window.showWarningMessage('No defined type name specifed. Exiting.');
        return;
      }
      this.terminal.sendText(`pdk new defined_type ${typeName}`);
      this.terminal.show();
      if (reporter) {
        reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewDefinedTypeCommandId);
      }
    });
  }
}
