'use strict';

import * as vscode from 'vscode';
import { Logger } from '../../logging';
import { reporter } from '../../telemetry/telemetry';
import * as messages from '../../messages';

export class pdkNewModuleCommand {
  private logger: Logger = undefined;
  private terminal: vscode.Terminal = undefined;

  constructor(logger: Logger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;
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
      vscode.window.showInputBox(dirOpts).then(dir => {
        this.terminal.sendText(`pdk new module --skip-interview ${moduleName} ${dir} && code ${dir} `);
        this.terminal.show();
        if (reporter) {
          reporter.sendTelemetryEvent('command', {
            command: messages.PDKCommandStrings.PdkNewModuleCommandId
          });
        }
      })
    })
  }

  public dispose(): any {
    this.terminal.dispose();
    this.terminal = undefined;
  }
}
