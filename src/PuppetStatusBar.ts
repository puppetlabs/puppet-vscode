import * as vscode from 'vscode';
import { PuppetCommandStrings } from './messages';
import { ConnectionStatus } from './interfaces';
import { PuppetConnectionMenuItem } from './PuppetConnectionMenuItem';
import { ILogger } from "./logging";

export class PuppetStatusBar {
  statusBarItem: vscode.StatusBarItem;
  private logger: ILogger;

  constructor(langIDs: string[], context:vscode.ExtensionContext, logger: ILogger) {
    this.logger = logger;
    context.subscriptions.push(vscode.commands.registerCommand(PuppetCommandStrings.PuppetShowConnectionMenuCommandId,
      () => { PuppetStatusBar.showConnectionMenu(); }
    ));
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    this.statusBarItem.command = PuppetCommandStrings.PuppetShowConnectionMenuCommandId;
    this.statusBarItem.show();
    vscode.window.onDidChangeActiveTextEditor(textEditor => {
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
    var statusIconText: string;
    var statusColor: string;

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
    if (this.statusBarItem.text !== statusIconText) { this.statusBarItem.text = statusIconText; }
    this.statusBarItem.tooltip = toolTip; // TODO: killme (new Date()).getUTCDate().toString() + "\nNewline\nWee!";
  }

  public static showConnectionMenu() {
    var menuItems: PuppetConnectionMenuItem[] = [];

    menuItems.push(
      new PuppetConnectionMenuItem(
        "Show Puppet Session Logs",
        () => { vscode.commands.executeCommand(PuppetCommandStrings.PuppetShowConnectionLogsCommandId); }),
    );
  
    vscode
      .window
      .showQuickPick<PuppetConnectionMenuItem>(menuItems)
      .then((selectedItem) => {
        if(selectedItem){
          selectedItem.callback();
        }
      });
  }
  
}
