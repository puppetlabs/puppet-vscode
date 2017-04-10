import * as vscode from 'vscode';

export class PuppetLintParser{
  static formatLintLine(line:string):vscode.Diagnostic{
    let fields = line.split(":");
    let severity = fields[0].toLowerCase() === "warning" ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error;
    let message = "puppet-lint: " + fields[0] + ": " + fields[2];
    let range = new vscode.Range(Number(fields[1]) - 1, 0, Number(fields[1]) -1, 300);
    let diagnostic = new vscode.Diagnostic(range, message, severity);
    return diagnostic;
  }
}