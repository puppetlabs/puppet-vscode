import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient'
import * as vscode from 'vscode';
import * as net from 'net';

import * as messages from '../src/messages';

export function startLangServerTCP(host: string, port: number, langID: string, documentSelector: string | string[], statusBarItem): LanguageClient {
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

  let clientOptions: LanguageClientOptions = {
    documentSelector: [langID],
  }

  var title = `tcp lang server (host ${host} port ${port})`;
  var languageServerClient = new LanguageClient(title, serverOptions, clientOptions)
  languageServerClient.onReady().then(() => {
    languageServerClient.sendRequest(messages.PuppetVersionRequest.type).then((versionDetails) => {
      statusBarItem.color = "#affc74";
      statusBarItem.text = "$(terminal) " + versionDetails.puppetVersion;
    });
  }, (reason) => {
    this.setSessionFailure("Could not start language service: ", reason);
  });

  return languageServerClient;
}