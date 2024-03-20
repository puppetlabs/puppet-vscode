import { assert } from 'chai';
import * as fs from 'fs';
import { after } from 'mocha';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { PuppetfileCompletionProvider } from '../../../feature/PuppetfileCompletionFeature';
import * as forge from '../../../forge';
import * as index from '../index';

suite('PuppetfileCompletionFeature Test Suite', () => {

  after (() => {
    getPuppetModuleCompletionStub.restore();
  });
  // Create a temporary file
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-test-'));
  const tempFilePath = path.join(tempDir, 'Puppetfile');
  let puppetfileCompletionProvider: PuppetfileCompletionProvider;
  puppetfileCompletionProvider = new PuppetfileCompletionProvider(index.logger);

  // Create a stub for getPuppetModuleCompletion, so we dont make an actual api call
  const getPuppetModuleCompletionStub = index.sandbox.stub(forge, 'getPuppetModuleCompletion');
  getPuppetModuleCompletionStub.returns(Promise.resolve({
    total: 3,
    modules: ['puppetlabs-stdlib', 'puppetlabs-concat', 'puppetlabs-apache']}));

  test('provideCompletionItems returns expected results', async () => {
    // a simple Puppetfile with one module
    const puppetfileContent = `
    forge 'https://forge.puppet.com'
    mod 'puppetlabs-'
  `.split('\n').map(line => line.trim()).join('\n').trim();

    fs.writeFileSync(tempFilePath, puppetfileContent);

    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(tempFilePath);
    const position = new vscode.Position(1, 'mod puppetlabs-'.length);
    const token = new vscode.CancellationTokenSource().token;
    const context = {} as vscode.CompletionContext;

    const result = await puppetfileCompletionProvider.provideCompletionItems(document, position, token, context);
    // Check if result is an instance of vscode.CompletionList
    if (result instanceof vscode.CompletionList) {
      for (const item of result.items) {
        assert.include(item.label, 'puppetlabs-');
        assert.strictEqual(item.kind, vscode.CompletionItemKind.Module);
      }
    }
  });

  test('provideCompletionItems returns undefined when line does not start with mod', async () => {
    // an invalid puppetfile
    const puppetfileContent = `
    forge 'https://forge.puppet.com'
    'puppetlabs-'
  `.split('\n').map(line => line.trim()).join('\n').trim();

    fs.writeFileSync(tempFilePath, puppetfileContent);

    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(tempFilePath);
    const position = new vscode.Position(1, 0);
    const token = new vscode.CancellationTokenSource().token;
    const context = {} as vscode.CompletionContext;

    const result = await puppetfileCompletionProvider.provideCompletionItems(document, position, token, context);
    assert.strictEqual(result, undefined);
  });
});
