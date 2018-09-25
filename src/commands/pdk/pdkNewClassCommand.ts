'use strict';

import * as vscode from 'vscode';
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import { PDKCommandStrings } from '../../messages';
import { IFeature } from '../../feature';

export class PDKNewClassCommand implements IFeature {
  private logger: ILogger;
  private terminal: vscode.Terminal;

  constructor(context:vscode.ExtensionContext, logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;

    context.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkNewClassCommandId, () => {
      this.run();
    }));
    this.logger.debug("Registered " + PDKCommandStrings.PdkNewClassCommandId + " command");
  }

  public run() {
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

  public dispose(): any {
    this.terminal.dispose();
  }
}
