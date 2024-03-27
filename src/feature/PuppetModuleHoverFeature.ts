import { getLocation } from 'jsonc-parser';
import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { buildMarkdown, getModuleInfo } from '../forge';
import { ILogger } from '../logging';
import { reporter } from '../telemetry';

export class PuppetModuleHoverFeature implements IFeature {
  constructor(public context: vscode.ExtensionContext, public logger: ILogger) {
    const selector = [{ language: 'json', scheme: '*', pattern: '**/metadata.json' }];
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    context.subscriptions.push(vscode.languages.registerHoverProvider(selector, new PuppetModuleHoverProvider(logger)));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispose() {}
}

export class PuppetModuleHoverProvider implements vscode.HoverProvider {
  constructor(public logger: ILogger) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Hover> | null {
    const offset = document.offsetAt(position);
    const location = getLocation(document.getText(), offset);

    if (location.isAtPropertyKey) {
      return;
    }

    if (location.path[0] !== 'dependencies') {
      return;
    }

    if (location.path[2] !== 'name') {
      return;
    }

    if (reporter) {
      reporter.sendTelemetryEvent('metadataJSON/Hover');
    }
    const wordPattern = new RegExp(/[\w/-]+/);
    let range = document.getWordRangeAtPosition(position, wordPattern);

    // If the range does not include the full module name, adjust the range
    if (!range.contains(position)) {
      const lineText = document.lineAt(position.line).text;
      const quoteIndex = lineText.indexOf('"', position.character);
      if (quoteIndex !== -1) {
        const start = lineText.lastIndexOf('"', position.character) + 1;
        const end = quoteIndex;
        range = new vscode.Range(position.line, start, position.line, end);
      }
    }
    const word = document.getText(range);

    this.logger.debug('Metadata hover info found ' + word + ' module');

    const name = word.replace('"', '').replace('"', '').replace('/', '-');

    const info = await getModuleInfo(name, this.logger);
    const markdown = buildMarkdown(info);
    const hoverinfo = new vscode.Hover(markdown, range);
    return hoverinfo;
  }
}
