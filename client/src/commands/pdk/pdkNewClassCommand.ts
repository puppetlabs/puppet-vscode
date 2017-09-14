'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;
import { Logger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import * as messages from '../../messages';

export class pdkNewClassCommand {
  private logger: Logger = undefined;
  private terminal: vscode.Terminal = undefined;

  constructor(logger: Logger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;
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
        reporter.sendTelemetryEvent('command', {
          command: messages.PDKCommandStrings.PdkNewClassCommandId
        });
      }
    })
  }

  public dispose(): any {
    this.terminal.dispose();
    this.terminal = undefined;
  }
}
