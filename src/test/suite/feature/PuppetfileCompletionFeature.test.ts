import { assert } from 'chai';
import * as fs from 'fs';
import { after, before, describe, it } from 'mocha';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PuppetfileCompletionProvider } from '../../../feature/PuppetfileCompletionFeature';
import * as forge from '../../../forge';
import { StdioConnectionHandler } from '../../../handlers/stdio';
import * as index from '../index';

describe('PuppetfileCompletionFeature', () => {

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-test-'));
  const tempFilePath = path.join(tempDir, 'manifest.pp');
  let sandbox: sinon.Sandbox;
  let connectionHandler: StdioConnectionHandler;
  let puppetfileCompletionProvider: PuppetfileCompletionProvider;
  let getPuppetModuleCompletionStub: sinon.SinonStub;

  before(() => {
    sandbox = sinon.createSandbox();
    connectionHandler = sandbox.createStubInstance(StdioConnectionHandler);
    puppetfileCompletionProvider = new PuppetfileCompletionProvider(index.logger);
    // Create a stub for getPuppetModuleCompletion, so we dont make an actual api call
    getPuppetModuleCompletionStub = sandbox.stub(forge, 'getPuppetModuleCompletion');
    getPuppetModuleCompletionStub.returns(Promise.resolve({
      total: 3,
      modules: ['puppetlabs-stdlib', 'puppetlabs-concat', 'puppetlabs-apache']
      })
    );
  });

  after (() => {
    sandbox.restore();
  });

  it('provideCompletionItems returns expected results', async () => {
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

  it('provideCompletionItems returns undefined when line does not start with mod', async () => {
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
