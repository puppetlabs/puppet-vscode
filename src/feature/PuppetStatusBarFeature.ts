'use strict';

import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { ConnectionStatus } from '../interfaces';
import { PuppetCommandStrings } from '../messages';
import { IAggregateConfiguration } from '../configuration';
import { ProtocolType } from '../settings';

class PuppetStatusBarProvider {
  private statusBarItem: vscode.StatusBarItem;
  private logger: ILogger;
  private config: IAggregateConfiguration;

  constructor(langIDs: string[], config: IAggregateConfiguration, logger: ILogger) {
    this.logger = logger;
    this.config = config;
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    this.statusBarItem.command = PuppetCommandStrings.PuppetShowConnectionMenuCommandId;
    this.statusBarItem.show();

    vscode.window.onDidChangeActiveTextEditor((textEditor) => {
      if (textEditor === undefined || langIDs.indexOf(textEditor.document.languageId) === -1) {
        this.statusBarItem.hide();
      } else {
        this.statusBarItem.show();
      }
    });
  }

  public setConnectionStatus(statusText: string, status: ConnectionStatus, toolTip: string): void {
    this.logger.debug(`Setting status bar to ${statusText}`);
    // Icons are from https://octicons.github.com/
    let statusIconText: string;
    let statusColor: string;

    switch (status) {
      case ConnectionStatus.RunningLoaded:
        statusIconText = '$(terminal) ';
        statusColor = '#affc74';
        break;
      case ConnectionStatus.RunningLoading:
        // When the editor service is starting, it's functional but it may be missing
        // type/class/function/fact info.  But language only features like format document
        // or document symbol, are available
        statusIconText = '$(sync~spin) ';
        statusColor = '#affc74';
        break;
      case ConnectionStatus.Failed:
        statusIconText = '$(alert) ';
        statusColor = '#fcc174';
        break;
      default:
        // ConnectionStatus.NotStarted
        // ConnectionStatus.Starting
        // ConnectionStatus.Stopping
        statusIconText = '$(gear) ';
        statusColor = '#f3fc74';
        break;
    }

    statusIconText = (statusIconText + statusText).trim();
    this.statusBarItem.color = statusColor;
    // Using a conditional here because resetting a $(sync~spin) will cause the animation to restart. Instead
    // Only change the status bar text if it has actually changed.
    if (this.statusBarItem.text !== statusIconText) {
      this.statusBarItem.text = statusIconText;
    }
    this.statusBarItem.tooltip = toolTip; // TODO: killme (new Date()).getUTCDate().toString() + "\nNewline\nWee!";
  }

  public showConnectionMenu() {
    const menuItems: PuppetConnectionMenuItem[] = [];

    menuItems.push(
      new PuppetConnectionMenuItem('Show Puppet Session Logs', () => {
        vscode.commands.executeCommand(PuppetCommandStrings.PuppetShowConnectionLogsCommandId);
      }),
    );

    if (
      this.config.ruby.pdkPuppetVersions !== undefined &&
      this.config.ruby.pdkPuppetVersions.length > 0 &&
      this.config.connection.protocol != ProtocolType.TCP
    ) {
      // Add a static menu item to use the latest version
      menuItems.push(
        new PuppetConnectionMenuItem('Switch to latest Puppet version', () => {
          vscode.commands.executeCommand(PuppetCommandStrings.PuppetUpdateConfigurationCommandId, {
            'puppet.editorService.puppet.version': undefined,
          });
        }),
      );
      this.config.ruby.pdkPuppetVersions
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })) // Reverse sort
        .forEach((puppetVersion) => {
          menuItems.push(
            new PuppetConnectionMenuItem('Switch to Puppet ' + puppetVersion.toString(), () => {
              vscode.commands.executeCommand(PuppetCommandStrings.PuppetUpdateConfigurationCommandId, {
                'puppet.editorService.puppet.version': puppetVersion,
              });
            }),
          );
        });
    }

    vscode.window.showQuickPick<PuppetConnectionMenuItem>(menuItems).then((selectedItem) => {
      if (selectedItem) {
        selectedItem.callback();
      }
    });
  }
}

class PuppetConnectionMenuItem implements vscode.QuickPickItem {
  public description = '';

  constructor(public readonly label: string, public readonly callback: () => void = () => {}) {}
}

export interface IPuppetStatusBar {
  setConnectionStatus(statusText: string, status: ConnectionStatus, toolTip: string);
}

export class PuppetStatusBarFeature implements IFeature, IPuppetStatusBar {
  private provider: PuppetStatusBarProvider;

  constructor(langIDs: string[], config: IAggregateConfiguration, logger: ILogger, context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand(PuppetCommandStrings.PuppetShowConnectionMenuCommandId, () => {
        this.provider.showConnectionMenu();
      }),
    );
    this.provider = new PuppetStatusBarProvider(langIDs, config, logger);
  }

  public setConnectionStatus(statusText: string, status: ConnectionStatus, toolTip: string): void {
    this.provider.setConnectionStatus(statusText, status, toolTip);
  }

  public dispose(): any {
    return undefined;
  }
}
