// src/providers/puppetParserValidateProvider.ts
'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;
import { lintProvider } from './lintProvider';

export class puppetParserValidateProvider extends lintProvider {
  
  private static commandId: string = 'puppet.puppetParserValidate';
  
  doLint(textDocument: vscode.TextDocument) {
    if(textDocument.languageId !== 'puppet') return;

    let fileName = textDocument.fileName;
    let command  = "puppet";
    let args     = ["parser", "validate", fileName, " --color=false"];
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
    let ertext = '';
    proc.stderr.on('data', (data: Buffer) => {
      ertext += data;
    })
    proc.stdout.on('end', ()=> {
      if(text.length <= 0) return;
      let diagnostics = this.parsePlainText(text);
      this.diagnosticCollection.set(textDocument.uri, diagnostics);
    });
    proc.stderr.on('end', ()=> {
      if(ertext.length <= 0) return;
      let diagnostics = this.parsePlainText(ertext);
      this.diagnosticCollection.set(textDocument.uri, diagnostics);
    });
  }

  private parsePlainText(text:string):vscode.Diagnostic[]{
    let diagnostics: vscode.Diagnostic[] = [];
    text.split("\n").forEach((l)=>{
      var regex = /^(Error|Warning)\:.*\:([0-9]:[0-9])$/;
      var test = l.match(regex);
      if( test === null){ return;}

      let message    = "puppet-validate: " + test[0];
      let severity = test[1].toLowerCase() === "warning" 
        ? vscode.DiagnosticSeverity.Warning
        : vscode.DiagnosticSeverity.Error;
      let positions = test[2].split(":");
      let range = new vscode.Range(Number(positions[0]) - 1, Number(positions[1]) - 1, Number(positions[0]) - 1, Number.MAX_VALUE - 1);
      
      let diagnostic = new vscode.Diagnostic(range, message, severity);
      diagnostics.push(diagnostic);
    })

    return diagnostics;
  }

}