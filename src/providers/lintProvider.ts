// src/providers/puppetLintProvider.ts
'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

export abstract class lintProvider{
  diagnosticCollection: vscode.DiagnosticCollection;
  
  abstract doLint(textDocument: vscode.TextDocument)
  
  public activate(subscriptions: vscode.Disposable[]) {
    subscriptions.push(this);
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection();

    vscode.workspace.onDidOpenTextDocument(this.doLint, this, subscriptions);
    vscode.workspace.onDidSaveTextDocument(this.doLint, this);
    vscode.workspace.onDidCloseTextDocument((textDocument)=> {
      this.diagnosticCollection.delete(textDocument.uri);
    }, null, subscriptions);

    vscode.workspace.textDocuments.forEach(this.doLint, this);
  }
  
  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }
}
