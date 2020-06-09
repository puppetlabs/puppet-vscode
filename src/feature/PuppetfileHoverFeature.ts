// const axios = require('axios');
import axios from 'axios';
import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { reporter } from '../telemetry';

interface PuppetForgeModuleInfo {
  uri: string;
  slug: string;
  name: string;
  downloads: number;
  score: number;
  created: Date;
  updated: Date;
  endorsement: string;
  owner: { slug: string; username: string };
  forgeUrl: string;
  homepageUrl: string;
  version: number;
  summary: string;
}

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

    const info = await this.getModuleInfo(text);
    const markdown = this.buildmarkdown(info);
    const hoverinfo = new vscode.Hover(markdown, range);
    return hoverinfo;
  }

  private buildmarkdown(info: PuppetForgeModuleInfo): vscode.MarkdownString {
    const message = `## ${info.name}\n
${info.summary}\n
**Latest version:** ${info.version} (${info.created.toDateString()})\n
**Forge**: [${info.forgeUrl}](${info.forgeUrl})\n
**Project**: [${info.homepageUrl}](${info.homepageUrl})\n
**Owner:** ${info.owner.username}\n
**Endorsement:** ${info.endorsement?.toLocaleUpperCase()}\n
**Score:** ${info.score}\n
`;
    return new vscode.MarkdownString(message);
  }

  private getModuleInfo(title: string): Promise<PuppetForgeModuleInfo> {
    return new Promise((resolve) => {
      return axios
        .get(`https://forgeapi.puppet.com/v3/modules/${title}`, {
          params: {
            // eslint-disable-next-line @typescript-eslint/camelcase
            exclude_fields: 'readme changelog license reference',
          },
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'User-Agent': 'puppet-vscode/0.27.0',
          },
        })
        .then((response) => {
          if (response.status !== 200) {
            this.logger.error(`Error getting Puppet forge data. Status: ${response.status}:${response.statusText}`);
            resolve();
          }

          const info = response.data;
          const module = {
            uri: info.uri,
            slug: info.slug,
            name: info.name,
            downloads: info.downloads,
            score: info.feedback_score,
            created: new Date(info.created_at),
            updated: new Date(info.updated_at),
            endorsement: info.endorsement ?? '',
            forgeUrl: `https://forge.puppet.com/${info.owner.username}/${info.name}`,
            homepageUrl: info.homepage_url ?? '',
            version: info.current_release.version,
            owner: {
              uri: info.owner.uri,
              slug: info.owner.slug,
              username: info.owner.username,
              gravatar: info.owner.gravatar_id,
            },
            summary: info.current_release.metadata.summary,
          };

          resolve(module);
        })
        .catch((error) => {
          this.logger.error(`Error getting Puppet forge data: ${error}`);
          resolve();
        });
    });
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
