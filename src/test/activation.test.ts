'use strict';

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

describe('Should do completion', function() {
  const docUri = getDocUri('empty.pp');
  var doc: vscode.TextDocument;
  var editor: vscode.TextEditor;
  var documentEol: string;
  var platformEol: string;
  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  before(async () => {
    // The extensionId is `publisher.name` from package.json
    const ext = vscode.extensions.getExtension('jpogran.puppet-vscode');
    await ext.activate();
    try {
      doc = await vscode.workspace.openTextDocument(docUri);
      editor = await vscode.window.showTextDocument(doc);
      
      await sleep(2000); // Wait for server activation
    } catch (e) {
      console.error(e);
    }
  });

  it('Completes simple snippets Puppet in txt file', async () => {
    var position = new vscode.Position(0, 0);

    var expectedCompletionList = {
      items: [
        // base snippets completion
        { label: 'case', kind: vscode.CompletionItemKind.Snippet },
        { label: 'if', kind: vscode.CompletionItemKind.Snippet },
        { label: 'unless', kind: vscode.CompletionItemKind.Snippet },
        // puppet language server completion
        // { label: 'user', kind: vscode.CompletionItemKind.Snippet }
      ]
    };

    // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
    const actualCompletionList = (await vscode.commands.executeCommand(
      'vscode.executeCompletionItemProvider',
      docUri,
      position
    )) as vscode.CompletionList;

    assert.equal(actualCompletionList.items.length, expectedCompletionList.items.length);
    expectedCompletionList.items.forEach((expectedItem, i) => {
      const actualItem = actualCompletionList.items[i];
      assert.equal(actualItem.label, expectedItem.label);
      assert.equal(actualItem.kind, expectedItem.kind);
    });
  });
});
