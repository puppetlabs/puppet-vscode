//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
// import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import { activate, getDocUri } from './helper';
const assert = require('chai').assert;

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

suite('Extension Tests', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('jpogran.puppet-vscode'));
  });

  test('Should activate', async function() {
    this.timeout(1 * 60 * 1000);
    return vscode.extensions
      .getExtension('jpogran.puppet-vscode')
      .activate()
      .then(api => {
        assert.ok(true);
      });
  });

  test('Should register all commands', function() {
    this.timeout(1 * 60 * 1000);
    return vscode.commands.getCommands(true).then(commands => {
      const COMMANDS = [
        'extension.puppetShowConnectionLogs',
        'extension.puppetShowConnectionMenu',
        'extension.puppetShowNodeGraphToSide',
        'extension.puppetResource',
        'extension.pdkNewModule',
        'extension.pdkNewClass',
        'extension.pdkNewTask',
        'extension.pdkTestUnit',
        'extension.pdkValidate',
        'puppet-bolt.OpenUserConfigFile',
        'puppet-bolt.OpenUserInventoryFile'
      ];
      const foundLiveServerCommands = commands.filter(value => {
        return COMMANDS.indexOf(value) >= 0;
      });
      assert.equal(foundLiveServerCommands.length, COMMANDS.length);
    });
  });

  test('Diagnoses syntax errors', async function() {
    this.timeout(1 * 60 * 1000);

    const docUri = getDocUri('diagnostics.pp');
    await testDiagnostics(docUri, [
      {
        message: "Could not parse for environment *root*: Syntax error at '}' (line: 4, column: 1)",
        range: toRange(3, 1, 3, 2),
        severity: vscode.DiagnosticSeverity.Error,
        source: 'Puppet'
      }
    ]);
  });

  test('Completes Puppet in pp file', async function() {
    this.timeout(1 * 60 * 1000);
    const docUri = getDocUri('completion.pp');
    await testCompletion(docUri, new vscode.Position(0, 0), {
      items: [{ label: 'user', kind: vscode.CompletionItemKind.Module }]
    });
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

  assert.isAbove(actualCompletionList.items.length, 1);

  expectedCompletionList.items.forEach((expectedItem, i) => {
    let result = actualCompletionList.items.find(e => e.label === expectedItem.label);
    assert.isOk(result);
    assert.equal(result.label, expectedItem.label);
    assert.equal(result.kind, expectedItem.kind);
  });
}

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new vscode.Position(sLine, sChar);
  const end = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
  await activate(docUri);

  const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

  assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i];
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
  });
}
