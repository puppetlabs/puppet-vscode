'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import * as messages from '../../messages';

export class pdkValidateCommand {
  private logger: ILogger = undefined;
  private terminal: vscode.Terminal = undefined;

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
    this.terminal = undefined;
  }
}
