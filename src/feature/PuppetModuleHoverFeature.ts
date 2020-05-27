import { getLocation } from 'jsonc-parser';
import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';

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

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Thenable<vscode.Hover> | null {
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

    const range = document.getWordRangeAtPosition(position);
    const word = document.getText(range);

    this.logger.debug('Metadata hover info found ' + word + ' module');

    const name = word.replace('"', '').replace('"', '').replace('/', '-');

    return this.getModuleInfo(name).then(function (result: any) {
      const msg: string[] = [];
      msg.push(`### ${result.slug}`);

      const releaseDate = new Date(result.releases[0].created_at);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const dateformat = require('dateformat');
      msg.push(`\nLatest version: ${result.releases[0].version} (${dateformat(releaseDate, 'dS mmmm yyyy')})`);

      if (result.endorsement !== null) {
        const endorsementCapitalized = result.endorsement.charAt(0).toUpperCase() + result.endorsement.slice(1);
        msg.push(`\nEndorsement: ${endorsementCapitalized}`);
      }

      msg.push(`\nOwner: ${result.owner.slug}`);

      const forgeUri = `https://forge.puppet.com/${result.owner.username}/${result.name}`;
      msg.push(`\nForge: [${forgeUri}](${forgeUri})\n`);

      if (result.homepage_url !== null) {
        msg.push(`\nProject: [${result.homepage_url}](${result.homepage_url})\n`);
      }

      const md = msg.join('\n');

      return Promise.resolve(new vscode.Hover(new vscode.MarkdownString(md), range));
    });
  }

  private getModuleInfo(name: string) {
    const options = {
      url: `https://forgeapi.puppet.com/v3/modules/${name}?exclude_fields=readme%20changelog%20license%20reference`,
    };
    return new Promise(function (resolve, reject) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const request = require('request');
      request.get(options, function (err, resp, body) {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(body));
        }
      });
    });
  }
}
