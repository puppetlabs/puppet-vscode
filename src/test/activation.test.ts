'use strict';

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

describe('Should do completion', () => {
  
  const docUri = getDocUri('empty.pp');
  before(()=>{
    activate(docUri);
  });

  it('Completes simple snippets Puppet in txt file', async () => {
    // await activate(docUri);
    await testCompletion(docUri, new vscode.Position(0, 0), {
      items: [
        { label: 'case', kind: vscode.CompletionItemKind.Snippet },
        { label: 'if', kind: vscode.CompletionItemKind.Snippet },
        { label: 'unless', kind: vscode.CompletionItemKind.Snippet }
      ]
    });
  });

  // it('Completes advanced Puppet in txt file', async () => {
  //   // await activate(docUri);
  //   await testCompletion(docUri, new vscode.Position(0, 0), {
  //     items: [
  //       { label: 'case', kind: vscode.CompletionItemKind.Snippet },
  //       { label: 'if', kind: vscode.CompletionItemKind.Snippet },
  //       { label: 'unless', kind: vscode.CompletionItemKind.Snippet },
  //       { label: 'user', kind: vscode.CompletionItemKind.Snippet },
  //     ]
  //   });
  // });
});

async function testCompletion(
  docUri: vscode.Uri,
  position: vscode.Position,
  expectedCompletionList: vscode.CompletionList
) {
  await activate(docUri);

  // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
  const actualCompletionList = (await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    docUri,
    position
  )) as vscode.CompletionList;

  // assert.equal(actualCompletionList.items.length, expectedCompletionList.items.length);
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = actualCompletionList.items[i];
    assert.equal(actualItem.label, expectedItem.label);
    assert.equal(actualItem.kind, expectedItem.kind);
  });
}
