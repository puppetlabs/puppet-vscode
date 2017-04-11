'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

export class puppetResourceCommand {
  private _statusBarItem: vscode.StatusBarItem;

  private pickPuppetResource(): Thenable<string> {
    let options: vscode.QuickPickOptions = {
      placeHolder: "Enter a Puppet resource to interrogate",
      matchOnDescription: true,
      matchOnDetail: true
    };
    return vscode.window.showInputBox(options);
  }

  public run() {

    if (!this._statusBarItem) {
      this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }

    this.pickPuppetResource().then((moduleName) => {
      if (moduleName) {

        let editor = vscode.window.activeTextEditor;
        if (!editor) {
          this._statusBarItem.hide();
          return;
        }

        let doc = editor.document;
        let command = "puppet";
        let args = ["resource", moduleName];

        let cwd = vscode.workspace.rootPath
          ? vscode.workspace.rootPath
          : undefined;
        let options = {
          cwd: cwd,
          shell: true,
        };
        args.concat

        let text = '';
        let proc = cp.spawn(command, args, options);
        if (!proc.pid) return;

        proc.stdout.on('data', (data: Buffer) => {
          text += data;
        })
        proc.stdout.on('end', ()=> {
          if (text.length <= 0) return;

          this.editCurrentDocument(doc.uri, text);

          this._statusBarItem.text = "Puppet resource finished!";
          this._statusBarItem.show();
        });
      }
    });

  }

  private runCommand(command, args, listener: (text) => string) {
    
  }

  private editCurrentDocument(uri, text) {
    let edit = new vscode.WorkspaceEdit();
    let position = new vscode.Position(0, 0);
    edit.insert(uri, position, text);
    vscode.workspace.applyEdit(edit);
  }

  dispose() {
    this._statusBarItem.dispose();
  }
}