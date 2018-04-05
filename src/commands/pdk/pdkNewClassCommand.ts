'use strict';

import * as vscode from 'vscode';
import { ILogger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import * as messages from '../../messages';

export class PDKNewClassCommand {
  private logger: ILogger;
  private terminal: vscode.Terminal;

  constructor(logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;
  }

  public run() {
    let nameOpts: vscode.QuickPickOptions = {
      placeHolder: 'Enter a name for the new Puppet class',
      matchOnDescription: true,
      matchOnDetail: true
    };
    vscode.window.showInputBox(nameOpts).then(moduleName => {
      this.terminal.sendText(`pdk new class ${moduleName}`);
      this.terminal.show();
      if (reporter) {
        reporter.sendTelemetryEvent(messages.PDKCommandStrings.PdkNewClassCommandId);
      }
    });
  }

  public dispose(): any {
    this.terminal.dispose();
  }
}
