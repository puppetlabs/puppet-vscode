'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { PDKCommandStrings } from '../messages';
import { reporter } from '../telemetry';

export class PDKFeature implements IFeature {
  constructor(context: vscode.ExtensionContext, logger: ILogger) {
    context.subscriptions.push(
      vscode.commands.registerCommand(PDKCommandStrings.pdkNewModuleCommandId, () => {
        this.pdkNewModuleCommand();
      }),
    );
    logger.debug('Registered ' + PDKCommandStrings.pdkNewModuleCommandId + ' command');

    // commands that require no user input
    [
      { id: 'extension.pdkValidate', request: 'pdk validate', type: 'validate' },
      { id: 'extension.pdkTestUnit', request: 'pdk test unit', type: 'test' },
    ].forEach((command) => {
      context.subscriptions.push(
        vscode.commands.registerCommand(command.id, () => {
          this.getTerminal().sendText(command.request);
          this.getTerminal().show();
          if (reporter) {
            reporter.sendTelemetryEvent(command.id);
          }
        }),
      );
      logger.debug(`Registered ${command.id} command`);
    });

    // commands that require user input
    [
      { id: 'extension.pdkNewClass', request: 'pdk new class', type: 'Puppet class' },
      { id: 'extension.pdkNewTask', request: 'pdk new task', type: 'Bolt task' },
      { id: 'extension.pdkNewDefinedType', request: 'pdk new defined_type', type: 'Puppet defined_type' },
      { id: 'extension.pdkNewFact', request: 'pdk new fact', type: 'Puppet Fact' },
      { id: 'extension.pdkNewFunction', request: 'pdk new function', type: 'Puppet Function' },
    ].forEach((command) => {
      context.subscriptions.push(
        vscode.commands.registerCommand(command.id, async () => {
          const name = await vscode.window.showInputBox({
            prompt: `Enter a name for the new ${command.type}`,
          });
          if (name === undefined) {
            vscode.window.showWarningMessage('No module name specifed. Exiting.');
            return;
          }

          const request = `${command.request} ${name}`;
          this.getTerminal().sendText(request);
          this.getTerminal().show();
          if (reporter) {
            reporter.sendTelemetryEvent(command.id);
          }
        }),
      );
      logger.debug(`Registered ${command.id} command`);
    });
  }

  private getTerminal(): vscode.Terminal {
    const existingTerm = vscode.window.terminals.find((tm) => tm.name === 'Puppet PDK');
    return existingTerm === undefined ? vscode.window.createTerminal('Puppet PDK') : existingTerm;
  }

  public dispose(): void {
    this.getTerminal().dispose();
  }

  private async pdkNewModuleCommand(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for the new Puppet module',
    });
    if (!name) {
      vscode.window.showWarningMessage('No module name specifed. Exiting.');
      return;
    }
    const directory = await vscode.window.showOpenDialog({
      canSelectMany: false,
      canSelectFiles: false,
      canSelectFolders: true,
      openLabel: 'Choose the path for the new Puppet module',
    });
    if (!directory) {
      vscode.window.showWarningMessage('No directory specifed. Exiting.');
      return;
    }

    const p = path.join(directory[0].fsPath, name);

    this.getTerminal().sendText(`pdk new module --skip-interview ${name} ${p}`);
    this.getTerminal().show();

    await new Promise<void>((resolve) => {
      let count = 0;
      const handle = setInterval(() => {
        count++;
        if (count >= 30) {
          clearInterval(handle);
          resolve();
          return;
        }

        if (fs.existsSync(p)) {
          resolve();
          return;
        }
      }, 1000);
    });

    const uri = vscode.Uri.file(p);
    await vscode.commands.executeCommand('vscode.openFolder', uri);

    if (reporter) {
      reporter.sendTelemetryEvent(PDKCommandStrings.pdkNewModuleCommandId);
    }
  }
}
