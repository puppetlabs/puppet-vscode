'use strict';

import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { PDKCommandStrings } from '../messages';
import { reporter } from '../telemetry/telemetry';

export class PdkCommandFeature implements IFeature {
  private logger: ILogger;
  private terminal: vscode.Terminal;

  constructor(context:vscode.ExtensionContext, logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;

    context.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkNewModuleCommandId, () => {
      this.pdkNewModule();
    }));
    this.logger.debug("Registered " + PDKCommandStrings.PdkNewModuleCommandId + " command");

    context.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkNewClassCommandId, () => {
      this.pdkNewClass();
    }));
    this.logger.debug("Registered " + PDKCommandStrings.PdkNewClassCommandId + " command");

    context.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkNewTaskCommandId, () => {
      this.pdkNewTask();
    }));
    this.logger.debug("Registered " + PDKCommandStrings.PdkNewTaskCommandId + " command");
  }

  public dispose(): any {
    this.terminal.dispose();
  }

  public pdkNewModule() {
    let nameOpts: vscode.QuickPickOptions = {
      placeHolder: "Enter a name for the new Puppet module",
      matchOnDescription: true,
      matchOnDetail: true
    };
    let dirOpts: vscode.QuickPickOptions = {
      placeHolder: "Enter a path for the new Puppet module",
      matchOnDescription: true,
      matchOnDetail: true
    };

    vscode.window.showInputBox(nameOpts).then(moduleName => {
      if (moduleName === undefined) {
        vscode.window.showWarningMessage('No module name specifed. Exiting.');
        return;
      }
      vscode.window.showInputBox(dirOpts).then(dir => {
        this.terminal.sendText(`pdk new module --skip-interview ${moduleName} ${dir}`);
        this.terminal.sendText(`code ${dir}`);
        this.terminal.show();
        if (reporter) {
          reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewModuleCommandId);
        }
      });
    });
  }

  public pdkNewClass() {
    let nameOpts: vscode.QuickPickOptions = {
      placeHolder: "Enter a name for the new Puppet class",
      matchOnDescription: true,
      matchOnDetail: true
    };
    vscode.window.showInputBox(nameOpts).then(moduleName => {
      this.terminal.sendText(`pdk new class ${moduleName}`);
      this.terminal.show();
      if (reporter) {
        reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewClassCommandId);
      }
    });
  }

  public pdkNewTask() {
    let nameOpts: vscode.QuickPickOptions = {
      placeHolder: "Enter a name for the new Puppet Task",
      matchOnDescription: true,
      matchOnDetail: true
    };
    vscode.window.showInputBox(nameOpts).then(taskName => {
      this.terminal.sendText(`pdk new task ${taskName}`);
      this.terminal.show();
      if (reporter) {
        reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewTaskCommandId);
      }
    });
  }
}
