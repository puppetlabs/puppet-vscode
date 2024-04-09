import * as assert from 'assert';
import { afterEach, before, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PuppetNodeGraphFeature } from '../../../feature/PuppetNodeGraphFeature';
import { StdioConnectionHandler } from '../../../handlers/stdio';
import { ConnectionStatus } from '../../../interfaces';
import * as index from '../index';

const mockContext: vscode.ExtensionContext = index.extContext;
let sendRequestStub: sinon.SinonStub;
let mockConnectionHandler: sinon.SinonStubbedInstance<StdioConnectionHandler>;
let sandbox: sinon.SinonSandbox;
let puppetNodeGraphFeature: PuppetNodeGraphFeature;

describe('PuppetNodeGraphFeature', () => {
  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    sandbox.stub(vscode.commands, 'registerCommand');
    mockConnectionHandler = sandbox.createStubInstance(StdioConnectionHandler);
    sandbox.stub(Object.getPrototypeOf(mockConnectionHandler), 'status').get(() => ConnectionStatus.RunningLoaded);
    sendRequestStub = sandbox.stub();
    const mockLanguageClient = {
      sendRequest: sendRequestStub
    };
    sandbox.stub(mockConnectionHandler, 'languageClient').get(() => mockLanguageClient);
    puppetNodeGraphFeature = new PuppetNodeGraphFeature(index.puppetLangID, mockConnectionHandler, index.logger, mockContext);
  });

  afterEach(() => {
    puppetNodeGraphFeature.dispose();
    sandbox.restore();
  });

  it('should construct PuppetNodeGraphFeature', () => {
    assert.ok(puppetNodeGraphFeature);
  });

  it('should open webview panel when puppetShowNodeGraphToSide command is executed', async () => {
    const createWebviewPanelSpy = sandbox.spy(vscode.window, 'createWebviewPanel');
    await vscode.commands.executeCommand('puppet.puppetShowNodeGraphToSide');
    assert.ok(createWebviewPanelSpy.calledWith(
      'puppetNodeGraph',
      'Node Graph \'manifest.pp\'',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    ));
  });
});
