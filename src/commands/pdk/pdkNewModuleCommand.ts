'use strict';

import * as vscode from 'vscode';
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import { PDKCommandStrings } from '../../messages';
import { IFeature } from '../../feature';

export class PDKNewModuleCommand implements IFeature {
  private logger: ILogger;
  private terminal: vscode.Terminal;

  constructor(context:vscode.ExtensionContext, logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;

    context.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkNewModuleCommandId, () => {
      this.run();
    }));
    this.logger.debug("Registered " + PDKCommandStrings.PdkNewModuleCommandId + " command");
  }

  public run() {
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

  public dispose(): any {
    this.terminal.dispose();
  }
}
