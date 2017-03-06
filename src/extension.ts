'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-puppet" is now active!');

  let lint = new PuppetLintProvider();
  let pcontroller = new PuppetLintController(lint);
  context.subscriptions.push(pcontroller);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class PuppetLintController {

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

class PuppetLintProvider{
  private diagnosticCollection: vscode.DiagnosticCollection;

  lint(textDocument: any){
    if(textDocument.languageId !== 'puppet') return;

    let fileName = textDocument.fileName;

    let text = '';
    let diagnostics: vscode.Diagnostic[] = [];
    let options = vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath } : undefined;
    let proc = cp.spawn('puppet-lint',
              ["--log-format", "%{KIND}:%{line}:%{message}", fileName], options);
    if (proc.pid) {
      proc.stdout.on('data', (data: Buffer) => {
        text += data;
      })
      proc.stdout.on('end', ()=> {
        text.split("\n").forEach(line=>{
          if(line){
            let fields = line.split(":");
            let severity = fields[0].toLowerCase() === "warning" ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error;
            let message = "puppet-lint: " + fields[0] + ": " + fields[2];
            let range = new vscode.Range(Number(fields[1]) - 1, 0, Number(fields[1]) -1, 300);
            let diagnostic = new vscode.Diagnostic(range, message, severity);
            diagnostics.push(diagnostic);
          }
        })
        this.diagnosticCollection.set(textDocument.uri, diagnostics);
      });
    }
  }

}