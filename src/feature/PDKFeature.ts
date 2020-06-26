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
    context.subscriptions.push(
      vscode.commands.registerCommand(PDKCommandStrings.PdkValidateCommandId, () => {
        this.pdkValidateCommand();
      }),
    );
    logger.debug('Registered ' + PDKCommandStrings.PdkValidateCommandId + ' command');
    context.subscriptions.push(
      vscode.commands.registerCommand(PDKCommandStrings.PdkTestUnitCommandId, () => {
        this.pdkTestUnitCommand();
      }),
    );
    logger.debug('Registered ' + PDKCommandStrings.PdkTestUnitCommandId + ' command');
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
    vscode.window.showInputBox(nameOpts).then((moduleName) => {
      this.terminal.sendText(`pdk new class ${moduleName}`);
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
      this.terminal.sendText(`pdk new defined_type ${typeName}`);
      this.terminal.show();
      if (reporter) {
        reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewDefinedTypeCommandId);
      }
    });
  }

  private pdkValidateCommand() {
    this.terminal.sendText(`pdk validate`);
    this.terminal.show();
    if (reporter) {
      reporter.sendTelemetryEvent(PDKCommandStrings.PdkValidateCommandId);
    }
  }

  private pdkTestUnitCommand() {
    this.terminal.sendText(`pdk test unit`);
    this.terminal.show();
    if (reporter) {
      reporter.sendTelemetryEvent(PDKCommandStrings.PdkTestUnitCommandId);
    }
  }
}
