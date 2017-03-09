import * as vscode from 'vscode';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

import { PuppetConfig } from '../../src/puppet/PuppetConfig';

export class PuppetLintProvider{
  private diagnosticCollection: vscode.DiagnosticCollection;

//  launch(cwd: string, args: string[]): Promise<LaunchResult> {
//     return PlatformInformation.GetCurrent().then(platformInfo => {
//         const options = Options.Read();

//         if (options.useEditorFormattingSettings) 
//         {
//             let editorConfig = vscode.workspace.getConfiguration('editor');
//             args.push(`formattingOptions:useTabs=${!editorConfig.get('insertSpaces', true)}`);
//             args.push(`formattingOptions:tabSize=${editorConfig.get('tabSize', 4)}`);
//             args.push(`formattingOptions:indentationSize=${editorConfig.get('tabSize',4)}`);
//         }

//         if (options.path && options.useMono) {
//             return launchNixMono(options.path, cwd, args);
//         }

//         const launchPath = options.path || getLaunchPath(platformInfo);

//         if (platformInfo.isWindows()) {
//             return launchWindows(launchPath, cwd, args);
//         }
//         else {
//             return launchNix(launchPath, cwd, args);
//         }
//     });
// }

  lint(textDocument: any){
    if(textDocument.languageId !== 'puppet') return;

    let config = new PuppetConfig();
    
    let puppetPath = config._findPuppetPath();

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