import * as vscode from 'vscode';
import { PuppetCommandStrings } from '../messages';
import { IConnectionManager } from '../connection';
import { ILogger } from '../logging';
import { PuppetFormatDocumentProvider } from '../providers/puppetFormatDocumentProvider';
import { PuppetStatusBar } from '../PuppetStatusBar';
import { ISettings } from '../settings';

export function setupPuppetCommands(langID:string, connManager:IConnectionManager, settings:ISettings, ctx:vscode.ExtensionContext, logger: ILogger){

  if (settings.format.enable === true) {
    ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('puppet', {
      provideDocumentFormattingEdits: (document, options, token) => { return PuppetFormatDocumentProvider(document, options, connManager); }}
    ));
  }

}
