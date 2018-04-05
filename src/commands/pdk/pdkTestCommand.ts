'use strict';

import * as vscode from 'vscode';
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import * as messages from '../../messages';

export class PDKTestUnitCommand {
  private logger: ILogger;
  private terminal: vscode.Terminal;

  constructor(logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;
  }

  public run() {
    this.terminal.sendText(`pdk test unit`);
    this.terminal.show();
    if (reporter) {
      reporter.sendTelemetryEvent(messages.PDKCommandStrings.PdkTestUnitCommandId);
    }
  }

  public dispose(): any {
    this.terminal.dispose();
  }
}
