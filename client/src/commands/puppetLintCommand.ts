'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

export class puppetLintCommand {
  private _statusBarItem: vscode.StatusBarItem;

  public fixDocument() {
    if (!this._statusBarItem) {
      this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }

    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      this._statusBarItem.hide();
      return;
    }

    let doc = editor.document;

    if(doc.languageId !== 'puppet') return;

    let fileName = doc.fileName;
    let command  = "puppet-lint";
    let args     = ["--fix", fileName];
    let cwd      = vscode.workspace.rootPath ? vscode.workspace.rootPath: undefined;
    let options = {
      cwd: cwd,
      shell: true,
    };
    args.concat

    let proc = cp.spawn(command, args, options);
    if (!proc.pid) return;
    
    let text = '';
    proc.stdout.on('data', (data: Buffer) => {
      text += data;
    })
    proc.stdout.on('end', ()=> {
      if(text.length <= 0) return;
      this._statusBarItem.text = text;
      this._statusBarItem.show();
    });
  }

  dispose() {
    this._statusBarItem.dispose();
  }
}