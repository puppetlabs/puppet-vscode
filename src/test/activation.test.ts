'use strict';

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

describe('Should do completion', () => {
  const docUri = getDocUri('foo.pp');

  it('Completes JS/TS in txt file', async () => {
    await activate(docUri);
    // await testCompletion(docUri, new vscode.Position(0, 0), {
    //   items: [
    //     { label: 'Puppet', kind: vscode.CompletionItemKind.Text }
    //   ]
    // });
  });
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
    // assert.equal(actualItem.label, expectedItem.label);
    // assert.equal(actualItem.kind, expectedItem.kind);
  });
}
