import * as vscode from 'vscode';
import { PDKCommandStrings } from '../messages';
import { IConnectionManager } from '../connection';
import { ILogger } from '../logging';
import { PDKNewModuleCommand } from './pdk/pdkNewModuleCommand';
import { PDKNewTaskCommand } from './pdk/pdkNewTaskCommand';
import { PDKValidateCommand } from './pdk/pdkValidateCommand';
import { PDKTestUnitCommand } from './pdk/pdkTestCommand';

export function setupPDKCommands(langID: string, connManager: IConnectionManager, ctx: vscode.ExtensionContext, logger: ILogger, terminal: vscode.Terminal) {
  let newModuleCommand = new PDKNewModuleCommand(logger, terminal);
  ctx.subscriptions.push(newModuleCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkNewModuleCommandId, () => {
    newModuleCommand.run();
  }));

  let newTaskCommand = new PDKNewTaskCommand(logger, terminal);
  ctx.subscriptions.push(newTaskCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkNewTaskCommandId, () => {
    newTaskCommand.run();
  }));

  let validateCommand = new PDKValidateCommand(logger, terminal);
  ctx.subscriptions.push(validateCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkValidateCommandId, () => {
    validateCommand.run();
  }));

  let testUnitCommand = new PDKTestUnitCommand(logger, terminal);
  ctx.subscriptions.push(testUnitCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(PDKCommandStrings.PdkTestUnitCommandId, () => {
    testUnitCommand.run();
  }));
}
