import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

import { PuppetLintProvider } from '../../src/puppet/PuppetLintProvider';

export class PuppetLintController {

  private _lintProvider: PuppetLintProvider;
  private _disposable: vscode.Disposable;

  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor(lintProvider: PuppetLintProvider) {

    this.diagnosticCollection = vscode.languages.createDiagnosticCollection();

    this._lintProvider = lintProvider;

    let subscriptions: vscode.Disposable[] = [];

    vscode.workspace.onDidOpenTextDocument(this._lintProvider.lint, this, subscriptions);
    vscode.workspace.onDidSaveTextDocument(this._lintProvider.lint, this);
    vscode.workspace.onDidCloseTextDocument((textDocument)=> {
      this.diagnosticCollection.delete(textDocument.uri);
    }, null, subscriptions);

    vscode.workspace.textDocuments.forEach(this._lintProvider.lint, this);

    this._disposable = vscode.Disposable.from(...subscriptions);
  }

  dispose() {
    this._disposable.dispose();

    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }
}