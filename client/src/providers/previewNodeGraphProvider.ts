'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient } from 'vscode-languageclient';
import { CompileNodeGraphRequest } from '../messages';

export function isNodeGraphFile(document: vscode.TextDocument) {
  return document.languageId === 'puppet'
    && document.uri.scheme !== 'puppet'; // prevent processing of own documents
}

export function getNodeGraphUri(uri: vscode.Uri) {
  if (uri.scheme === 'puppet') {
    return uri;
  }

  return uri.with({
    scheme: 'puppet',
    path: uri.fsPath + '.rendered',
    query: uri.toString()
  });
}

export class PuppetNodeGraphContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private _waiting: boolean = false;
  private _langServer: LanguageClient = undefined;
  
  constructor(
    private context: vscode.ExtensionContext,
    private langServer: LanguageClient
  ) {
    this._langServer = langServer;
  }

  public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
    const sourceUri = vscode.Uri.parse(uri.query);

    return vscode.workspace.openTextDocument(sourceUri).then(document => {
      const initialData = {
        previewUri: uri.toString(),
        source: sourceUri.toString(),
      };

      // Content Security Policy
      const nonce = new Date().getTime() + '' + new Date().getMilliseconds();
      // Use the language server to render the document
      return this._langServer
        .sendRequest(CompileNodeGraphRequest.type, sourceUri)
        .then(
          (compileResult) => {

          var graphContent = ''
          if (compileResult.dotContent != null) {
            var styling = `
            bgcolor = "transparent"
            color = "white"
            rankdir = "TB"
            node [ shape="box" penwidth="2" color="#e0e0e0" style="rounded,filled" fontname="Courier New" fillcolor=black, fontcolor="white"]
            edge [ style="bold" color="#f0f0f0" penwith="2" ]

            label = ""`

            graphContent = compileResult.dotContent;
            graphContent = graphContent.replace(`label = "vscode"`,styling);
            graphContent = `<textarea id="graphviz_data" style="display:none">\n` + graphContent + `\n</textarea>`;
          }

          var errorContent = `<div>${compileResult.error}</div>`
          if (compileResult.error == null) { errorContent = ''; }

          // WARNING - THIS IS A MAJOR HACK!!!
          return `
            ${errorContent}
            ${graphContent}
            <div id="graphviz_svg_div">
              <!-- Target for dynamic svg generation -->
            </div>

            <!-- Defer loading of javascript by placing these tags at the tail end of the document -->
            <script language="javascript" type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"> </script>
            <script language="javascript" type="text/javascript" src="http://www.webgraphviz.com/viz.js"></script>

            <script language="javascript" type="text/javascript">
              var svg_div = jQuery('#graphviz_svg_div');
              var graphviz_data_textarea = jQuery('#graphviz_data');
              
              // Startup function: call UpdateGraphviz
              jQuery(function() {
                svg_div.html("");
                  var data = graphviz_data_textarea.val();
                  // Generate the Visualization of the Graph into "svg".
                  var svg = Viz(data, "svg");
                  svg_div.html(svg);
              });
            </script>`;
      })
    });
  }

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  public update(uri: vscode.Uri) {
    if (!this._waiting) {
      this._waiting = true;
      setTimeout(() => {
        this._waiting = false;
        this._onDidChange.fire(uri);
      }, 300);
    }
  }
}
