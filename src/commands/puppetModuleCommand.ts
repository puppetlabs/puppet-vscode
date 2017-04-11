'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import QuickPickItem = vscode.QuickPickItem;

var request = require('request');

export class puppetModuleCommand {
  private _statusBarItem: vscode.StatusBarItem;

  public listModules() {
    if (!this._statusBarItem) {
      this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }

    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      this._statusBarItem.hide();
      return;
    }

    let doc = editor.document;

    if (doc.languageId !== 'puppet') return;

    let fileName = doc.fileName;
    let command = "puppet-lint";
    let args = ["--fix", fileName];
    let cwd = vscode.workspace.rootPath ? vscode.workspace.rootPath : undefined;

    let options: any = {
      url: 'https://forgeapi.puppetlabs.com:443/v3/modules?show_deleted=false&sort_by=rank',
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET',
    };
    return new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        var modules = JSON.parse(body);

        var items: QuickPickItem[] = [];
        for (var item in modules.results) {
          let foo = modules.results[item];
          items.push({ label: modules.results[item].name, description: modules.results[item].current_release.metadata.description });
        };

        let options: vscode.QuickPickOptions = {
          placeHolder: "Select a PowerShell module to install",
          matchOnDescription: true,
          matchOnDetail: true
        };

        return vscode.window.showQuickPick(items, options).then(item => {
          return item ? item.label : "";
        });
      })
    })
  }

  dispose() {
    this._statusBarItem.dispose();
  }
}