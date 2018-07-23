import * as vscode from 'vscode';
import { PuppetCommandStrings } from '../messages';
import { IConnectionManager } from '../connection';
import { ILogger } from '../logging';
import {
  PuppetNodeGraphContentProvider, isNodeGraphFile,
  getNodeGraphUri, showNodeGraph
} from '../providers/previewNodeGraphProvider';
import { PuppetResourceCommand } from '../commands/puppet/puppetResourceCommand';
import { PuppetFormatDocumentProvider } from '../providers/puppetFormatDocumentProvider';
import { PuppetStatusBar } from '../PuppetStatusBar';

export function setupPuppetCommands(langID:string, connManager:IConnectionManager, ctx:vscode.ExtensionContext, logger: ILogger){

  let resourceCommand = new PuppetResourceCommand(connManager, logger);
  ctx.subscriptions.push(resourceCommand);
  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetResourceCommandId, () => {
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

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetNodeGraphToTheSideCommandId,
    uri => showNodeGraph(uri, true))
  );

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetShowConnectionMenuCommandId,
    () => { PuppetStatusBar.showConnectionMenu(); }
  ));

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetShowConnectionLogsCommandId,
    () => { connManager.showLogger(); }
  ));

  ctx.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetRestartSessionCommandId,
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
