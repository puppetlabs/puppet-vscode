import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { getPuppetModuleCompletion } from '../forge';
import { ILogger } from '../logging';

export class PuppetfileCompletionProvider implements vscode.CompletionItemProvider {
  constructor(public logger: ILogger) {}
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList> {
    // get all text until the `position` and check if it reads `mod.`
    const linePrefix = document.lineAt(position).text.substr(0, position.character);
    if (!linePrefix.startsWith('mod')) {
      return undefined;
    }

    const completionText = document.getText(document.getWordRangeAtPosition(position));

    const data = await getPuppetModuleCompletion(completionText, this.logger);

    const l: vscode.CompletionList = new vscode.CompletionList();
    data.modules.forEach((element) => {
      l.items.push(new vscode.CompletionItem(element, vscode.CompletionItemKind.Module));
    });

    return l;
  }

  resolveCompletionItem?(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.CompletionItem> {
    throw new Error('Method not implemented.');
  }
}

export class PuppetfileCompletionFeature implements IFeature {
  constructor(public context: vscode.ExtensionContext, public logger: ILogger) {
    const selector = [{ scheme: 'file', language: 'puppetfile' }];
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(selector, new PuppetfileCompletionProvider(logger)),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispose() {}
}
