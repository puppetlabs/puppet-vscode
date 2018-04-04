'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import * as messages from '../../messages';

export class pdkNewTaskCommand {
  private logger: ILogger = undefined;
  private terminal: vscode.Terminal = undefined;

  constructor(logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;
  }

  public run() {
    let nameOpts: vscode.QuickPickOptions = {
      placeHolder: "Enter a name for the new Puppet Task",
      matchOnDescription: true,
      matchOnDetail: true
    };
    vscode.window.showInputBox(nameOpts).then(taskName => {
      this.terminal.sendText(`pdk new task ${taskName}`);
      this.terminal.show();
      if (reporter) {
        reporter.sendTelemetryEvent(messages.PDKCommandStrings.PdkNewTaskCommandId);
      }
    })
  }

  public dispose(): any {
    this.terminal.dispose();
    this.terminal = undefined;
  }
}
