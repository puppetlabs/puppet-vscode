import * as vscode from 'vscode';
import * as net from 'net';
import * as path from 'path';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;
import {
  LanguageClient, LanguageClientOptions, ServerOptions
} from 'vscode-languageclient'

import * as messages from '../src/messages';

export function createLanguageServerProcess(serverExe: string, myOutputChannel: vscode.OutputChannel) {
  myOutputChannel.appendLine('Language server found at: ' + serverExe)

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
      myOutputChannel.appendLine('Windows spawn process does not work at the moment')
      vscode.window.showErrorMessage('Windows spawn process does not work at the moment. Functionality will be limited to syntax highlighting');
      break;
    default:
      myOutputChannel.appendLine('Starting language server')
      cmd = 'ruby'
      options = {
        shell: true,
        env: process.env,
        stdio: 'pipe',
      };
  }

  var proc = cp.spawn(cmd, args, options)
  console.log("ProcID = " + proc.pid);
  myOutputChannel.appendLine('Language server PID:' + proc.pid)

  return proc;
}

export function startLangServerTCP(host: string, port: number, langID: string, statusBarItem, myOutputChannel): LanguageClient {
  myOutputChannel.appendLine('Configuring language server options')
  let serverOptions: ServerOptions = function () {
    return new Promise((resolve, reject) => {
      var client = new net.Socket();
      client.connect(port, host, function () {
        resolve({ reader: client, writer: client });
      });
      client.on('error', function (err) {
        console.log(`[Puppet Lang Server Client] ` + err);
      })
    });
  }

  myOutputChannel.appendLine('Configuring language server client options')
  let clientOptions: LanguageClientOptions = {
    documentSelector: [langID],
  }

  myOutputChannel.appendLine('Starting language server client')
  var title = `tcp lang server (host ${host} port ${port})`;
  var languageServerClient = new LanguageClient(title, serverOptions, clientOptions)
  languageServerClient.onReady().then(() => {
    myOutputChannel.appendLine('Language server client started, setting puppet version')
    languageServerClient.sendRequest(messages.PuppetVersionRequest.type).then((versionDetails) => {
      statusBarItem.color = "#affc74";
      statusBarItem.text = "$(terminal) " + versionDetails.puppetVersion;
    });
  }, (reason) => {
    this.setSessionFailure("Could not start language service: ", reason);
  });

  return languageServerClient;
}