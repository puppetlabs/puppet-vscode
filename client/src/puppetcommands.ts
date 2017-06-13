import * as vscode from 'vscode';
import {
  LanguageClient, LanguageClientOptions, ServerOptions
} from 'vscode-languageclient'

import { puppetResourceCommand } from '../src/commands/puppetResourceCommand';
import * as messages from '../src/messages';
import {
  PuppetNodeGraphContentProvider, isNodeGraphFile, getNodeGraphUri,
  showNodeGraph, getViewColumn
} from '../src/providers/previewNodeGraphProvider';

export function setupPuppetCommands(langID:string, languageServerClient:LanguageClient, ctx:vscode.ExtensionContext){

  let resourceCommand = new puppetResourceCommand(languageServerClient);
  ctx.subscriptions.push(resourceCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetResourceCommandId, () => {
    resourceCommand.run();
  }));

  ctx.subscriptions.push(vscode.commands.registerCommand(messages.PuppetCommandStrings.PuppetNodeGraphToTheSideCommandId,
    uri => showNodeGraph(uri, true))
  );
  
  const contentProvider = new PuppetNodeGraphContentProvider(ctx, languageServerClient);
  const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(langID, contentProvider);

  ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
    if (isNodeGraphFile(document)) {
      const uri = getNodeGraphUri(document.uri);
      contentProvider.update(uri);
    }
  }));
}
