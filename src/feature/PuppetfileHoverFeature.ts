// const axios = require('axios');
import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { buildMarkdown, getModuleInfo } from '../forge';
import { ILogger } from '../logging';
import { reporter } from '../telemetry';

class PuppetfileHoverProvider implements vscode.HoverProvider {
  constructor(public readonly logger: ILogger) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Hover> {
    if (token.isCancellationRequested) {
      return null;
    }

    const range = document.getWordRangeAtPosition(position);
    const line = document.lineAt(position);
    if (line.isEmptyOrWhitespace) {
      return null;
    }

    if (reporter) {
      reporter.sendTelemetryEvent('puppetfile/Hover');
    }

    const text = line.text
      .replace(new RegExp('mod\\s+'), '')
      .replace(new RegExp(",\\s+'\\d.\\d.\\d\\'"), '')
      .replace(new RegExp(',\\s+:latest'), '')
      .replace("'", '')
      .replace("'", '');

    const info = await getModuleInfo(text, this.logger);
    const markdown = buildMarkdown(info);
    const hoverinfo = new vscode.Hover(markdown, range);
    return hoverinfo;
  }
}

export class PuppetfileHoverFeature implements IFeature {
  constructor(public context: vscode.ExtensionContext, public logger: ILogger) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider('puppetfile', new PuppetfileHoverProvider(logger)),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispose(): void {}
}
