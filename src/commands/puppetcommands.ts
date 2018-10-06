import * as vscode from 'vscode';
import { PuppetCommandStrings } from '../messages';
import { IConnectionManager } from '../connection';
import { ILogger } from '../logging';

export function setupPuppetCommands(connManager:IConnectionManager, ctx:vscode.ExtensionContext, logger: ILogger){

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetShowConnectionLogsCommandId,
    () => { connManager.showLogger(); }
  ));

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetRestartSessionCommandId,
    () => { connManager.restartConnection(); }
  ));
}
