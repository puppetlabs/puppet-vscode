import * as vscode from 'vscode';
import { PDKCommandStrings } from '../messages';
import { IConnectionManager } from '../connection';
import { ILogger } from '../logging';
import { PDKValidateCommand } from './pdk/pdkValidateCommand';
import { PDKTestUnitCommand } from './pdk/pdkTestCommand';

export function setupPDKCommands(langID: string, connManager: IConnectionManager, ctx: vscode.ExtensionContext, logger: ILogger, terminal: vscode.Terminal) {
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
