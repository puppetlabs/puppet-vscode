import * as vscode from 'vscode';

export class PuppetConnectionMenuItem implements vscode.QuickPickItem {
  public description: string = '';

  constructor(public readonly label: string, public readonly callback: () => void = () => { })
  {
  }
}
