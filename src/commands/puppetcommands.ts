import * as vscode from 'vscode';
import { PuppetCommandStrings } from '../messages';
import { IConnectionManager } from '../connection';
import { ILogger } from '../logging';
import { PuppetStatusBar } from '../PuppetStatusBar';

export function setupPuppetCommands(connManager:IConnectionManager, ctx:vscode.ExtensionContext, logger: ILogger){

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
