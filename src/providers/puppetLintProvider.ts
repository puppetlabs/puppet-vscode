// src/providers/puppetLintProvider.ts
'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;
import { lintProvider } from './lintProvider';

export class puppetLintProvider extends lintProvider {
  
  private static commandId: string = 'puppet.puppetlint';
  
  doLint(textDocument: vscode.TextDocument) {
    if(textDocument.languageId !== 'puppet') return;

    let fileName = textDocument.fileName;
    let command  = "puppet-lint";
    let args     = ["--json", fileName];
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
      let diagnostics = this.parseJSON(text);
      this.diagnosticCollection.set(textDocument.uri, diagnostics);
    });
  }

  private parseJSON(text:string):vscode.Diagnostic[]{
    let diagnostics: vscode.Diagnostic[] = [];
    JSON.parse(text).forEach( item => {
      let severity = item.kind.toLowerCase() === "warning" 
        ? vscode.DiagnosticSeverity.Warning
        : vscode.DiagnosticSeverity.Error;
      let message    = "puppet-lint: " + item.message;
      let range      = new vscode.Range(Number(item.line)-1, 0, Number(item.line)-1, 300);
      let diagnostic = new vscode.Diagnostic(range, message, severity);
      diagnostics.push(diagnostic);
    });
    return diagnostics;
  }

}