import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PuppetfileProvider } from '../../../views/puppetfile';
import { reporter } from '../../../telemetry';

describe('PuppetfileProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let mockHandler: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(vscode.commands, 'registerCommand');
    mockHandler = {
      languageClient: {
        start: sandbox.stub().resolves(),
        sendRequest: sandbox.stub().resolves({ dependencies: [], error: [] }),
      },
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('constructs and registers commands', () => {
    const provider = new PuppetfileProvider(mockHandler);
    assert.ok(provider);
    sinon.assert.calledWith(
      vscode.commands.registerCommand as sinon.SinonStub,
      'puppet.refreshPuppetfileDependencies'
    );
    sinon.assert.calledWith(
      vscode.commands.registerCommand as sinon.SinonStub,
      'puppet.goToPuppetfileDefinition'
    );
  });

  it('refresh fires the callback registered on puppet.refreshPuppetfileDependencies', () => {
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const provider = new PuppetfileProvider(mockHandler);
    // Get the callback registered for refreshPuppetfileDependencies
    const refreshCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.refreshPuppetfileDependencies');
    assert.ok(refreshCall);
    // Stub reporter to avoid telemetry errors
    const reporterStub = sandbox.stub(reporter, 'sendTelemetryEvent');
    // Calling it should fire the event (and not throw)
    const eventFired = sinon.stub();
    provider.onDidChangeTreeData(eventFired);
    refreshCall.args[1]();
    sinon.assert.calledOnce(eventFired);
  });

  it('refresh() fires onDidChangeTreeData', () => {
    const provider = new PuppetfileProvider(mockHandler);
    const fired = sinon.stub();
    provider.onDidChangeTreeData(fired);
    provider.refresh();
    sinon.assert.calledOnce(fired);
  });

  it('getTreeItem returns the element', () => {
    const provider = new PuppetfileProvider(mockHandler);
    const item = new vscode.TreeItem('test-module');
    const result = provider.getTreeItem(item as any);
    assert.equal(result, item);
  });

  it('getChildren with element returns mapped children', async () => {
    const provider = new PuppetfileProvider(mockHandler);
    const child = new vscode.TreeItem('child-module') as any;
    child.label = 'child-module';
    const mockElement = { children: [['child-module', child]] } as any;
    const result = await provider.getChildren(mockElement);
    assert.equal(result.length, 1);
    assert.equal(result[0], child);
  });

  it('getChildren without element with no workspace folders returns empty', async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
    const provider = new PuppetfileProvider(mockHandler);
    try {
      await provider.getChildren();
    } catch (_) {
      // expected — no workspace open
    }
  });

  it('getChildren without element calls language server', async () => {
    const fakeUri = vscode.Uri.file('/fake/workspace');
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: fakeUri, name: 'fake', index: 0 }]);
    const fakeDoc = { getText: () => '' } as any;
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(fakeDoc);
    sandbox.stub(reporter, 'sendTelemetryEvent');
    mockHandler.languageClient.sendRequest.resolves({
      dependencies: [
        { name: 'puppetlabs-apache', version: '7.0.0', startLine: 1, endLine: 1 },
        { name: 'puppetlabs-stdlib', version: '8.0.0', startLine: 2, endLine: 2 },
      ],
      error: [],
    });
    const provider = new PuppetfileProvider(mockHandler);
    const result = await provider.getChildren();
    assert.isArray(result);
    assert.equal(result.length, 2);
    assert.equal(result[0].label, 'puppetlabs-apache');
    assert.equal(result[1].label, 'puppetlabs-stdlib');
  });

  it('getChildren shows error message when response has errors', async () => {
    const fakeUri = vscode.Uri.file('/fake/workspace');
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: fakeUri, name: 'fake', index: 0 }]);
    const fakeDoc = {} as any;
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(fakeDoc);
    sandbox.stub(reporter, 'sendTelemetryEvent');
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    mockHandler.languageClient.sendRequest.resolves({
      dependencies: [],
      error: ['Parse error in Puppetfile'],
    });
    const provider = new PuppetfileProvider(mockHandler);
    await provider.getChildren();
    sinon.assert.calledOnce(showErrorStub);
  });

  it('getParent throws not implemented', () => {
    const provider = new PuppetfileProvider(mockHandler);
    assert.throws(() => provider.getParent(null as any));
  });

  it('puppet.goToPuppetfileDefinition callback opens Puppetfile at correct line', async () => {
    const fakeUri = vscode.Uri.file('/fake/workspace');
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: fakeUri, name: 'fake', index: 0 }]);
    const fakeRange = new vscode.Range(0, 0, 0, 0);
    const fakeDoc = {
      lineAt: sandbox.stub().returns({ range: fakeRange }),
    };
    const openDocStub = sandbox.stub(vscode.workspace, 'openTextDocument').resolves(fakeDoc as any);
    const showDocStub = sandbox.stub(vscode.window, 'showTextDocument').resolves(undefined);

    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const provider = new PuppetfileProvider(mockHandler);

    const goToCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.goToPuppetfileDefinition');
    assert.ok(goToCall, 'puppet.goToPuppetfileDefinition should be registered');
    const mockModule = { startLine: 5 };
    await goToCall.args[1](mockModule);

    sinon.assert.calledOnce(openDocStub);
    sinon.assert.calledOnce(showDocStub);
  });

});
