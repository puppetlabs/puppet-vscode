'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { PDKCommandStrings } from '../messages';
import { reporter } from '../telemetry';

export class PDKFeature implements IFeature {
  private terminal: vscode.Terminal;

  constructor(context: vscode.ExtensionContext, logger: ILogger) {
    const suspendedTerm = vscode.window.terminals.find((tm) => tm.name === 'Puppet PDK');
    this.terminal = suspendedTerm === undefined ? vscode.window.createTerminal('Puppet PDK') : suspendedTerm;

    this.terminal.processId.then((pid) => {
      logger.debug('pdk shell started, pid: ' + pid);
    });
    context.subscriptions.push(this.terminal);

    context.subscriptions.push(
      vscode.commands.registerCommand(PDKCommandStrings.PdkNewModuleCommandId, () => {
        this.pdkNewModuleCommand();
      }),
    );
    logger.debug('Registered ' + PDKCommandStrings.PdkNewModuleCommandId + ' command');

    // commands that require no user input
    [
      { id: 'extension.pdkValidate', request: 'pdk validate', type: 'validate' },
      { id: 'extension.pdkTestUnit', request: 'pdk test unit', type: 'test' },
    ].forEach((command) => {
      context.subscriptions.push(
        vscode.commands.registerCommand(command.id, () => {
          this.terminal.sendText(command.request);
          this.terminal.show();
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
          this.terminal.sendText(request);
          this.terminal.show();
          if (reporter) {
            reporter.sendTelemetryEvent(command.id);
          }
        }),
      );
      logger.debug(`Registered ${command.id} command`);
    });
  }

  public dispose(): void {
    this.terminal.dispose();
  }

  private async pdkNewModuleCommand(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for the new Puppet module',
    });
    if (name === undefined) {
      vscode.window.showWarningMessage('No module name specifed. Exiting.');
      return;
    }
    const directory = await vscode.window.showOpenDialog({
      canSelectMany: false,
      canSelectFiles: false,
      canSelectFolders: true,
      openLabel: 'Choose the path for the new Puppet module',
    });
    if (directory === undefined) {
      vscode.window.showWarningMessage('No directory specifed. Exiting.');
      return;
    }

    const p = path.join(directory[0].fsPath, name);

    this.terminal.sendText(`pdk new module --skip-interview ${name} ${p}`);
    this.terminal.show();

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
      reporter.sendTelemetryEvent(PDKCommandStrings.PdkNewModuleCommandId);
    }
  }
}
