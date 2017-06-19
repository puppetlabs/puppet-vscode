import * as vscode from 'vscode';
import * as net from 'net';
import * as path from 'path';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;
import {
  LanguageClient, LanguageClientOptions, ServerOptions
} from 'vscode-languageclient'

import * as messages from '../src/messages';
import { setupPuppetCommands } from '../src/puppetcommands';

const langID = 'puppet'; // don't change this

export class SessionManager {

  private context : vscode.ExtensionContext;
  private outputChannel: vscode.OutputChannel;
  private languageServerClient: LanguageClient;
  private statusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    this.outputChannel = vscode.window.createOutputChannel('Puppet');
    this.outputChannel.show();

    this.languageServerClient = null;
    this.statusBarItem = undefined;
  }

  public start() {
    try {
      var contextPath = this.context.asAbsolutePath(path.join('vendor', 'languageserver', 'puppet-languageserver'));

      let config = vscode.workspace.getConfiguration('puppet');

      var host             = config['languageserver']['address']; // '127.0.0.1';
      var port             = config['languageserver']['port']; // 8081;
      var stopOnClientExit = config['languageserver']['stopOnClientExit']; // true;
      var timeout          = config['languageserver']['timeout']; // 10;
      var preLoadPuppet    = config['languageserver']['preLoadPuppet']; // true;

      this.createStatusBarItem();

      if (host == '127.0.0.1' || host == 'localhost' || host == '') {
        var serverProc = this.createLanguageServerProcess(contextPath);

        serverProc.stdout.on('data', (data) => {
          console.log("OUTPUT: " + data.toString());
          this.outputChannel.appendLine("OUTPUT: " + data.toString());

          this.startLangServerTCP(host, port);
          this.context.subscriptions.push(this.languageServerClient.start());
        });

        serverProc.on('close', (exitCode) => {
          console.log("SERVER terminated with exit code: " + exitCode);
          this.outputChannel.appendLine("SERVER terminated with exit code: " + exitCode);
        });
      }
      else {
        this.startLangServerTCP(host, port);
        this.context.subscriptions.push(this.languageServerClient.start());
      }

      setupPuppetCommands(langID, this.languageServerClient, this.context);

      console.log('Congratulations, your extension "vscode-puppet" is now active!');
      this.outputChannel.appendLine('Congratulations, your extension "vscode-puppet" is now active!');
    } catch (e) {
      console.log((<Error>e).message);//conversion to Error type
      this.outputChannel.appendLine((<Error>e).message);
    }
  }

  private createLanguageServerProcess(serverExe: string) {
    this.outputChannel.appendLine('Language server found at: ' + serverExe)

    let cmd = '';
    let args = [serverExe];
    let options = {};

    // type Platform = 'aix'
    //               | 'android'
    //               | 'darwin'
    //               | 'freebsd'
    //               | 'linux'
    //               | 'openbsd'
    //               | 'sunos'
    //               | 'win32';
    switch (process.platform) {
      case 'win32':
        this.outputChannel.appendLine('Windows spawn process does not work at the moment')
        vscode.window.showErrorMessage('Windows spawn process does not work at the moment. Functionality will be limited to syntax highlighting');
        break;
      default:
        this.outputChannel.appendLine('Starting language server')
        cmd = 'ruby'
        options = {
          shell: true,
          env: process.env,
          stdio: 'pipe',
        };
    }

    var proc = cp.spawn(cmd, args, options)
    console.log("ProcID = " + proc.pid);
    this.outputChannel.appendLine('Language server PID:' + proc.pid)

    return proc;
  }

  private startLangServerTCP(host: string, port: number) {
    this.outputChannel.appendLine('Configuring language server options')
    let serverOptions: ServerOptions = () => {
      return new Promise((resolve, reject) => {
        var client = new net.Socket();
        client.connect(port, host, function () {
          resolve({ reader: client, writer: client });
        });
        client.on('error', (err) => {
          console.log(`[Puppet Lang Server Client] ` + err);
          this.promptForRestart();
        })
      });
    }

    this.outputChannel.appendLine('Configuring language server client options')
    let clientOptions: LanguageClientOptions = {
      documentSelector: [langID],
    }

    this.outputChannel.appendLine('Starting language server client')
    var title = `tcp lang server (host ${host} port ${port})`;
    this.languageServerClient = new LanguageClient(title, serverOptions, clientOptions)
    this.languageServerClient.onReady().then(() => {
      this.outputChannel.appendLine('Language server client started, setting puppet version')
      this.languageServerClient.sendRequest(messages.PuppetVersionRequest.type).then((versionDetails) => {
        this.statusBarItem.color = "#affc74";
        this.statusBarItem.text = "$(terminal) " + versionDetails.puppetVersion;
      });
    }, (reason) => {
      this.outputChannel.appendLine("Could not start language service: " + reason);
    });
  }

  private createStatusBarItem() {
    if (this.statusBarItem === undefined) {
      // Create the status bar item and place it right next to the language indicator
      this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
      this.statusBarItem.show();
      vscode.window.onDidChangeActiveTextEditor(textEditor => {
        if (textEditor === undefined || textEditor.document.languageId !== "puppet") {
          this.statusBarItem.hide();
        }
        else {
          this.statusBarItem.show();
        }
      })
    }
  }

  private restartSession() {
    this.languageServerClient = null;
    this.statusBarItem = undefined;

    this.start();
  }

  private promptForRestart() {
    vscode.window.showErrorMessage(
      "The Puppet Language Server session has terminated due to an error, would you like to restart it?",
      "Yes", "No")
      .then((answer) => { if (answer === "Yes") { this.restartSession(); }});
    }
}
