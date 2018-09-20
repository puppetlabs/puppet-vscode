'use strict';

import * as vscode from 'vscode';
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import { PDKCommandStrings } from '../../messages';
import { IFeature } from '../../feature';

export class PDKValidateCommand implements IFeature{
  private logger: ILogger;
  private terminal: vscode.Terminal;

  constructor(context:vscode.ExtensionContext, logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;

    context.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkValidateCommandId, () => {
      this.run();
    }));
    this.logger.debug("Registered " + PDKCommandStrings.PdkValidateCommandId + " command");
  }

  public run() {
    this.terminal.sendText(`pdk validate`);
    this.terminal.show();
    if (reporter) {
      reporter.sendTelemetryEvent(PDKCommandStrings.PdkValidateCommandId);
    }
  }

  public dispose(): any {
    this.terminal.dispose();
  }
}
