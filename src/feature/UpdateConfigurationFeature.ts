'use strict';

import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { PuppetCommandStrings } from '../messages';

export class UpdateConfigurationFeature implements IFeature {
  private logger: ILogger;
  private settingsRequireRestart = ['puppet.editorService.puppet.version'];

  private async updateSettingsAsync(updateSettingsHash) {
    // If there are no workspace folders then we've just opened a puppet file.  Therefore we can't updated the workspace folder settings, so we need to update
    // the global configuration instead.
    const configTarget =
      vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0
        ? vscode.ConfigurationTarget.Global
        : null;
    var requiresRestart = false;

    await Object.keys(updateSettingsHash).forEach((key) => {
      requiresRestart = requiresRestart || this.settingsRequireRestart.includes(key);
      let value = updateSettingsHash[key];
      let config = vscode.workspace.getConfiguration();
      this.logger.debug('Updating configuration item ' + key + " to '" + value + "'");
      config.update(key, value, configTarget);
    });

    if (requiresRestart) {
      vscode.window
        .showInformationMessage(
          'Puppet extensions needs to restart the editor. Would you like to do that now?',
          { modal: false },
          ...['Yes', 'No'],
        )
        .then((selection) => {
          if (selection === 'Yes') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
    }
  }

  constructor(logger: ILogger, context: vscode.ExtensionContext) {
    this.logger = logger;
    context.subscriptions.push(
      vscode.commands.registerCommand(PuppetCommandStrings.PuppetUpdateConfigurationCommandId, (updateSettingsHash) => {
        this.updateSettingsAsync(updateSettingsHash);
      }),
    );
  }

  public dispose(): any {
    return undefined;
  }
}
