import { ExtensionContext, commands, window, Uri } from 'vscode';
import { IFeature } from '../feature';
import * as path from 'path';
import * as fs from 'fs';
import { reporter } from '../telemetry';

export class BoltFeature implements IFeature {
  dispose() { }
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      commands.registerCommand('puppet-bolt.OpenUserConfigFile', () => {
        let userInventoryFile = path.join(process.env['USERPROFILE'] || '~', '.puppetlabs', 'bolt', 'bolt.yaml');

        this.openOrCreateFile(
          userInventoryFile,
          `Default bolt config yml not present. Do you want to create it?`,
          '# This is an empty bolt config file.\n# You can get started quickly by using the built-in bolt snippets'
        );

        if (reporter) {
          reporter.sendTelemetryEvent('puppet-bolt.OpenUserConfigFile');
        }
      })
    );

    context.subscriptions.push(
      commands.registerCommand('puppet-bolt.OpenUserInventoryFile', () => {
        let userInventoryFile = path.join(process.env['USERPROFILE'] || '~', '.puppetlabs', 'bolt', 'inventory.yaml');

        this.openOrCreateFile(
          userInventoryFile,
          `Default bolt inventory yml not present. Do you want to create it?`,
          '# This is an empty bolt inventory file.\n# You can get started quickly by using the built-in bolt snippets or use bolt to generate an inventory file from PuppetDb'
        );

        if (reporter) {
          reporter.sendTelemetryEvent('puppet-bolt.OpenUserInventoryFile');
        }
      })
    );
  }

  private openOrCreateFile(file: string, message: string, template: string) {
    if (!fs.existsSync(file)) {
      window
        .showQuickPick(['yes', 'no'], {
          placeHolder: message,
          canPickMany: false,
          ignoreFocusOut: true
        })
        .then(answer => {
          switch (answer) {
            case 'no':
              break;
            case 'yes':
              fs.writeFile(file, template, 'utf8', function (err) {
                window.showErrorMessage(`Error creating file ${file}. Error: ${err.message}`);
              });
              commands.executeCommand('vscode.openFolder', Uri.file(file), false);
          }
        });
    }
    else {
      commands.executeCommand('vscode.openFolder', Uri.file(file), false);
    }
  }
}
