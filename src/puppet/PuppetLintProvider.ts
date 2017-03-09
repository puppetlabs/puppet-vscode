import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

import { PuppetConfig } from '../../src/puppet/PuppetConfig';
import { PuppetLintParser } from '../../src/puppet/PuppetLintParser';

export class PuppetLintProvider{
  private diagnosticCollection: vscode.DiagnosticCollection;

  lint(textDocument: any){
    if(textDocument.languageId !== 'puppet') return;

    let diagnostics: vscode.Diagnostic[] = [];
    let text = '';
    let command = '';

    let fileName = textDocument.fileName;
    let options = vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath } : undefined;
    let commandOptions = ["--log-format", "%{KIND}:%{line}:%{message}", fileName];

    if (process.platform == "win32") {
      command = "cmd.exe";
      commandOptions = ["/c", "puppet-lint"].concat(commandOptions);
    }
    else {
      command = "puppet-lint";
    }
    commandOptions.concat

    let proc = cp.spawn(command, commandOptions, options);
    if (proc.pid) {
      proc.stdout.on('data', (data: Buffer) => {
        text += data;
      })
      proc.stdout.on('end', ()=> {
        text.split("\n").forEach(line=>{
          if(line){
            let diagnostic = PuppetLintParser.formatLintLine(line);
            diagnostics.push(diagnostic);
          }
        })
        this.diagnosticCollection.set(textDocument.uri, diagnostics);
      });
    }
  }

}