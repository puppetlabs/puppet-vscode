import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PuppetFactsProvider } from '../../../views/facts';

describe('PuppetFactsProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let mockHandler: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(vscode.commands, 'registerCommand');
    mockHandler = {
      languageClient: {
        start: sandbox.stub().resolves(),
        sendRequest: sandbox.stub(),
      },
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('constructs and registers refresh command', () => {
    const provider = new PuppetFactsProvider(mockHandler);
    assert.ok(provider);
    sinon.assert.calledWith(vscode.commands.registerCommand as sinon.SinonStub, 'puppet.refreshFacts');
  });

  it('refresh fires onDidChangeTreeData event', () => {
    const provider = new PuppetFactsProvider(mockHandler);
    const fired = sinon.stub();
    provider.onDidChangeTreeData(fired);
    provider.refresh();
    sinon.assert.calledOnce(fired);
  });

  it('getTreeItem returns the element', () => {
    const provider = new PuppetFactsProvider(mockHandler);
    const list = (provider as any).toList({ key: 'value' });
    const result = provider.getTreeItem(list[0][1]);
    assert.equal(result, list[0][1]);
  });

  it('toList creates flat PuppetFact items', () => {
    const provider = new PuppetFactsProvider(mockHandler);
    const data = { os: 'linux', version: '20.04', kernel: 'Linux' };
    const result = (provider as any).toList(data);
    assert.equal(result.length, 3);
    assert.equal(result[0][0], 'os');
    assert.equal(result[0][1].label, 'os');
    assert.equal(result[0][1].description, 'linux');
    assert.isUndefined(result[0][1].children);
  });

  it('toList creates nested PuppetFact items for object values', () => {
    const provider = new PuppetFactsProvider(mockHandler);
    const data = { network: { interfaces: { eth0: '10.0.0.1' } } };
    const result = (provider as any).toList(data);
    assert.equal(result.length, 1);
    assert.equal(result[0][0], 'network');
    assert.ok(result[0][1].children);
    assert.equal(result[0][1].children.length, 1);
  });

  it('getChildren with element returns mapped children', async () => {
    const provider = new PuppetFactsProvider(mockHandler);
    const data = { parent: { child1: 'val1', child2: 'val2' } };
    const list = (provider as any).toList(data);
    const parentFact = list[0][1];
    const children = await provider.getChildren(parentFact);
    assert.equal(children.length, 2);
    assert.equal(children[0].label, 'child1');
    assert.equal(children[1].label, 'child2');
  });

  it('getChildren without element fetches facts when factsLoaded is true', async () => {
    mockHandler.languageClient.sendRequest
      .onFirstCall().resolves({ factsLoaded: true })
      .onSecondCall().resolves({ facts: { os: 'linux', version: '20.04' }, error: '' });
    const provider = new PuppetFactsProvider(mockHandler);
    const result = await provider.getChildren();
    assert.isArray(result);
    assert.equal(result.length, 2);
  });

  it('getChildren without element fetches nested facts when factsLoaded is true', async () => {
    mockHandler.languageClient.sendRequest
      .onFirstCall().resolves({ factsLoaded: true })
      .onSecondCall().resolves({ facts: { network: { ip: '10.0.0.1' } }, error: '' });
    const provider = new PuppetFactsProvider(mockHandler);
    const result = await provider.getChildren();
    assert.isArray(result);
    assert.equal(result.length, 1);
    assert.ok(result[0].children);
  });

  it('getParent throws not implemented', () => {
    const provider = new PuppetFactsProvider(mockHandler);
    assert.throws(() => provider.getParent(null as any));
  });

  it('getChildren without element polls until factsLoaded via setInterval', async () => {
    const clock = sandbox.useFakeTimers();
    // First getVersion: factsLoaded false
    // Second getVersion (inside interval): factsLoaded true
    // getFacts: return data
    mockHandler.languageClient.sendRequest
      .onFirstCall().resolves({ factsLoaded: false })
      .onSecondCall().resolves({ factsLoaded: true })
      .onThirdCall().resolves({ facts: { os: 'linux' }, error: '' });

    const provider = new PuppetFactsProvider(mockHandler);
    const promise = provider.getChildren();

    // Advance past one interval tick
    await clock.tickAsync(1001);
    const result = await promise;
    clock.restore();

    assert.isArray(result);
    assert.equal(result.length, 1);
  });
});
