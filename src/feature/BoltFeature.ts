import * as fs from 'fs';
import * as path from 'path';
import { commands, ExtensionContext, Uri, window } from 'vscode';
import { IFeature } from '../feature';
import { reporter } from '../telemetry';

export class BoltFeature implements IFeature {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispose() {}

  showDeprecation() {
    const message =
      'The "Open Bolt User Configuration File" and "Open Bolt User Inventory File" commands will be removed in a future release. Do you think they should be kept? Think there are other ways for this extension to help using Puppet Bolt? Let us know by clicking "Feedback" to add a comment to Github Issue #639';
    window.showWarningMessage(message, { modal: false }, { title: 'Feedback' }).then((result) => {
      if (result === undefined) {
        return;
      }

      if (result.title === 'Feedback') {
        commands.executeCommand('vscode.open', Uri.parse('https://github.com/puppetlabs/puppet-vscode/issues/639'));
      }
    });
  }

  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      commands.registerCommand('puppet-bolt.OpenUserConfigFile', () => {
        this.showDeprecation();

        const userInventoryFile = path.join(process.env['USERPROFILE'] || '~', '.puppetlabs', 'bolt', 'bolt.yaml');

        this.openOrCreateFile(
          userInventoryFile,
          `Default bolt config yml not present. Do you want to create it?`,
          '# This is an empty bolt config file.\n# You can get started quickly by using the built-in bolt snippets',
        );

        if (reporter) {
          reporter.sendTelemetryEvent('puppet-bolt.OpenUserConfigFile');
        }
      }),
    );

    context.subscriptions.push(
      commands.registerCommand('puppet-bolt.OpenUserInventoryFile', () => {
        this.showDeprecation();

        const userInventoryFile = path.join(process.env['USERPROFILE'] || '~', '.puppetlabs', 'bolt', 'inventory.yaml');

        this.openOrCreateFile(
          userInventoryFile,
          `Default bolt inventory yml not present. Do you want to create it?`,
          '# This is an empty bolt inventory file.\n# You can get started quickly by using the built-in bolt snippets or use bolt to generate an inventory file from PuppetDb',
        );

        if (reporter) {
          reporter.sendTelemetryEvent('puppet-bolt.OpenUserInventoryFile');
        }
      }),
    );
  }

  private openOrCreateFile(file: string, message: string, template: string) {
    if (!fs.existsSync(file)) {
      window
        .showQuickPick(['yes', 'no'], {
          placeHolder: message,
          canPickMany: false,
          ignoreFocusOut: true,
        })
        .then((answer) => {
          // eslint-disable-next-line default-case
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
    } else {
      commands.executeCommand('vscode.openFolder', Uri.file(file), false);
    }
  }
}
