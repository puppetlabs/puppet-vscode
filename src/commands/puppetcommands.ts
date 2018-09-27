import * as vscode from 'vscode';
import { PuppetCommandStrings } from '../messages';
import { IConnectionManager } from '../connection';
import { ILogger } from '../logging';
import { PuppetResourceCommand } from '../commands/puppet/puppetResourceCommand';
import { PuppetStatusBar } from '../PuppetStatusBar';

export function setupPuppetCommands(connManager:IConnectionManager, ctx:vscode.ExtensionContext, logger: ILogger){

  let resourceCommand = new PuppetResourceCommand(connManager, logger);
  ctx.subscriptions.push(resourceCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetResourceCommandId, () => {
    resourceCommand.run();
  }));

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetShowConnectionMenuCommandId,
    () => { PuppetStatusBar.showConnectionMenu(); }
  ));

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetShowConnectionLogsCommandId,
    () => { connManager.showLogger(); }
  ));

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetRestartSessionCommandId,
    () => { connManager.restartConnection(); }
  ));
}
