import * as vscode from 'vscode';
import * as messages from '../../src/messages';
import { IConnectionManager } from '../../src/connection';
import { ILogger } from '../../src/logging';
import {
  PuppetNodeGraphContentProvider, isNodeGraphFile,
  getNodeGraphUri, showNodeGraph
} from '../../src/providers/previewNodeGraphProvider';
import { puppetResourceCommand } from '../commands/puppet/puppetResourceCommand';
import { PuppetFormatDocumentProvider } from '../providers/puppetFormatDocumentProvider';

export function setupPuppetCommands(langID:string, connManager:IConnectionManager, ctx:vscode.ExtensionContext, logger: ILogger){

  let resourceCommand = new puppetResourceCommand(connManager, logger);
  ctx.subscriptions.push(resourceCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetResourceCommandId, () => {
    resourceCommand.run();
  }));

  ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('puppet', {
    provideDocumentFormattingEdits: (document, options, token) => {
      if (vscode.workspace.getConfiguration('puppet').get('format.enable')) {
        return PuppetFormatDocumentProvider(document, options, connManager)
      } else {
        return []
      }
    }
  }));

  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetNodeGraphToTheSideCommandId,
    uri => showNodeGraph(uri, true))
  );

  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetShowConnectionMenuCommandId,
    () => { connManager.showConnectionMenu(); }
  ));

  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetShowConnectionLogsCommandId,
    () => { connManager.showLogger(); }
  ));

  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetRestartSessionCommandId,
    () => { connManager.restartConnection(); }
  ));

  const contentProvider = new PuppetNodeGraphContentProvider(ctx, connManager);
  const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(langID, contentProvider);

  ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
    if (isNodeGraphFile(document)) {
      const uri = getNodeGraphUri(document.uri);
      contentProvider.update(uri);
    }
  }));
}
