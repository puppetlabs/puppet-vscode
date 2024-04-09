import { assert } from 'chai';
import * as jsoncParser from 'jsonc-parser';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PuppetModuleHoverProvider } from '../../../feature/PuppetModuleHoverFeature';
import * as forge from '../../../forge';
import { OutputChannelLogger } from '../../../logging/outputchannel';
import * as telemetry from '../../../telemetry';
import * as index from '../index';

describe('PuppetModuleHoverProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let logger: OutputChannelLogger;
  let document: vscode.TextDocument;
  let position: vscode.Position;
  let token: vscode.CancellationToken;
  let provider: PuppetModuleHoverProvider;
  const mockModuleInfo: forge.PuppetForgeModuleInfo = {
    uri: '/v3/modules/puppetlabs-stdlib',
    slug: 'puppetlabs-stdlib',
    name: 'puppetlabs/stdlib',
    downloads: 0,
    score: 0,
    created: new Date(),
    updated: new Date(),
    endorsement: 'supported',
    owner: { slug: 'puppetlabs', username: 'puppetlabs' },
    forgeUrl: 'https://forge.puppet.com/modules/puppetlabs/stdlib',
    homepageUrl: 'https://github.com/puppetlabs/puppetlabs-stdlib',
    version: 0,
    summary: 'summary',
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    logger = index.logger;
    provider = new PuppetModuleHoverProvider(logger);
    document = {
      getText: sandbox.stub().returns(''),
      offsetAt: sandbox.stub().returns(0),
      getWordRangeAtPosition: sandbox.stub().returns(new vscode.Range(0, 0, 0, 0))
    } as unknown as vscode.TextDocument;

    position = new vscode.Position(0, 0);
    token = new vscode.CancellationTokenSource().token;
    sandbox.stub(forge, 'getModuleInfo').returns(Promise.resolve(mockModuleInfo));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return null if cancellation token is already cancelled', async () => {
    // Set up token to be cancelled
    const result = await provider.provideHover(document, position, token);
    assert.isUndefined(result);
  });

  it('should return null if location is at property key', async () => {
    sandbox.stub(jsoncParser, 'getLocation').returns({ isAtPropertyKey: true });
    const result = await provider.provideHover(document, position, token);
    assert.isUndefined(result);
  });

  it('should return null if the first element in the location path is not "dependencies"', async () => {
    sandbox.stub(jsoncParser, 'getLocation').returns({ path: ['not-dependencies'] });
    const result = await provider.provideHover(document, position, token);
    assert.isUndefined(result);
  });

  it('should return null if the third element in the location path is not "name"', async () => {
    sandbox.stub(jsoncParser, 'getLocation').returns({ path: ['dependencies', 'some-element', 'not-name'] });
    const result = await provider.provideHover(document, position, token);
    assert.isUndefined(result);
  });

  it('should send a telemetry event when a hover is provided', async () => {
    sandbox.stub(jsoncParser, 'getLocation').returns({ path: ['dependencies', 'some-element', 'name'] });
    const sendTelemetryEvent = sandbox.stub();
    sandbox.stub(telemetry, 'reporter').value({ sendTelemetryEvent });
    await provider.provideHover(document, position, token);
    assert.isTrue(sendTelemetryEvent.calledWith('metadataJSON/Hover'));
  });

  it('should return hover info with module information if getModuleInfo is successful', async () => {
    // Stub the jsoncParser.getLocation method to return a valid path
    sandbox.stub(jsoncParser, 'getLocation').returns({ path: ['dependencies', 'some-element', 'name'] });

    const result = await provider.provideHover(document, position, token);
    const contents = result.contents[0] as vscode.MarkdownString;
    assert.include(contents.value, mockModuleInfo.name);
    assert.include(contents.value, mockModuleInfo.summary);
    assert.include(contents.value, mockModuleInfo.version.toString());
  });
});
