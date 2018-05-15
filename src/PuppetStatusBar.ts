import * as vscode from 'vscode';
import { PuppetCommandStrings } from './messages';
import { ConnectionStatus } from './interfaces';
import { PuppetConnectionMenuItem } from './PuppetConnectionMenuItem';

export class PuppetStatusBar {
  statusBarItem: vscode.StatusBarItem;

  constructor(langID: string) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    this.statusBarItem.command = PuppetCommandStrings.PuppetShowConnectionMenuCommandId;
    this.statusBarItem.show();
    vscode.window.onDidChangeActiveTextEditor(textEditor => {
      if (textEditor === undefined || textEditor.document.languageId !== langID) {
        this.statusBarItem.hide();
      } else {
        this.statusBarItem.show();
      }
    });
  }

  public setConnectionStatus(statusText: string, status: ConnectionStatus): void {
    console.log(statusText);
    // Set color and icon for 'Running' by default
    var statusIconText = '$(terminal) ';
    var statusColor = '#affc74';

    if (status === ConnectionStatus.Starting) {
      statusIconText = '$(sync) ';
      statusColor = '#f3fc74';
    } else if (status === ConnectionStatus.Failed) {
      statusIconText = '$(alert) ';
      statusColor = '#fcc174';
    }

    this.statusBarItem.color = statusColor;
    this.statusBarItem.text = statusIconText + statusText;
  }

  public static showConnectionMenu() {
    var menuItems: PuppetConnectionMenuItem[] = [];
  
    menuItems.push(
      new PuppetConnectionMenuItem(
        "Restart Current Puppet Session",
        () => { vscode.commands.executeCommand(PuppetCommandStrings.PuppetRestartSessionCommandId); }),
    )
  
    menuItems.push(
      new PuppetConnectionMenuItem(
        "Show Puppet Session Logs",
        () => { vscode.commands.executeCommand(PuppetCommandStrings.PuppetShowConnectionLogsCommandId); }),
    )
  
    vscode
      .window
      .showQuickPick<PuppetConnectionMenuItem>(menuItems)
      .then((selectedItem) => { selectedItem.callback(); });
  }
  
}
