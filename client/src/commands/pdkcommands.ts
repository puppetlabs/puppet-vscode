import * as vscode from 'vscode';
import * as messages from '../../src/messages';
import { IConnectionManager } from '../../src/connection';
import { Logger } from '../../src/logging';
import { pdkNewModuleCommand } from './pdk/pdkNewModuleCommand';
import { pdkNewClassCommand } from './pdk/pdkNewClassCommand';
import { pdkValidateCommand } from './pdk/pdkValidateCommand';
import { pdkTestUnitCommand } from './pdk/pdkTestCommand';

export function setupPDKCommands(langID: string, connManager: IConnectionManager, ctx: vscode.ExtensionContext, logger: Logger, terminal: vscode.Terminal) {
  let newModuleCommand = new pdkNewModuleCommand(logger, terminal);
  ctx.subscriptions.push(newModuleCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PDKCommandStrings.PdkNewModuleCommandId, () => {
    newModuleCommand.run();
  }));

  let newClassCommand = new pdkNewClassCommand(logger, terminal);
  ctx.subscriptions.push(newClassCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PDKCommandStrings.PdkNewClassCommandId, () => {
    newClassCommand.run();
  }));

  let validateCommand = new pdkValidateCommand(logger, terminal);
  ctx.subscriptions.push(validateCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PDKCommandStrings.PdkValidateCommandId, () => {
    validateCommand.run();
  }));

  let testUnitCommand = new pdkTestUnitCommand(logger, terminal);
  ctx.subscriptions.push(testUnitCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PDKCommandStrings.PdkTestUnitCommandId, () => {
    testUnitCommand.run();
  }));
}
