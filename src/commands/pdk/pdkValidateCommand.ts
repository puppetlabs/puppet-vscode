'use strict';

import * as vscode from 'vscode';
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import * as messages from '../../messages';

export class PDKValidateCommand {
  private logger: ILogger;
  private terminal: vscode.Terminal;

  constructor(logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;
  }

  public run() {
    this.terminal.sendText(`pdk validate`);
    this.terminal.show();
    if (reporter) {
      reporter.sendTelemetryEvent(messages.PDKCommandStrings.PdkValidateCommandId);
    }
  }

  public dispose(): any {
    this.terminal.dispose();
  }
}
