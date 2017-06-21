import * as vscode from 'vscode';
import { puppetResourceCommand } from '../src/commands/puppetResourceCommand';
import * as messages from '../src/messages';
import { PuppetNodeGraphContentProvider, isNodeGraphFile, getNodeGraphUri, showNodeGraph } from '../src/providers/previewNodeGraphProvider';
import { IConnectionManager } from './connection';

export function setupPuppetCommands(langID:string, connManager:IConnectionManager, ctx:vscode.ExtensionContext){

  let resourceCommand = new puppetResourceCommand(connManager);
  ctx.subscriptions.push(resourceCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetResourceCommandId, () => {
    resourceCommand.run();
  }));

  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetNodeGraphToTheSideCommandId,
    uri => showNodeGraph(uri, true))
  );
  
  const contentProvider = new PuppetNodeGraphContentProvider(ctx, connManager);
  const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(langID, contentProvider);

  ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
    if (isNodeGraphFile(document)) {
      const uri = getNodeGraphUri(document.uri);
      contentProvider.update(uri);
    }
  }));
}
