import { assert } from 'chai';
import { afterEach, before, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PuppetResourceFeature } from '../../../feature/PuppetResourceFeature';
import { ConnectionHandler } from '../../../handler';
import { StdioConnectionHandler } from '../../../handlers/stdio';
import { ConnectionStatus } from '../../../interfaces';
import { OutputChannelLogger } from '../../../logging/outputchannel';
import * as index from '../index';

describe('PuppetResourceFeature Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let puppetResourceFeature: PuppetResourceFeature;
  let connectionHandler: ConnectionHandler;
  let logger: OutputChannelLogger = index.logger;
  let context: vscode.ExtensionContext = index.extContext;
  let editCurrentDocumentStub: sinon.SinonStub;
  let resolveDocumentChanged: () => void;
  let documentChanged: Promise<void>;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    sandbox.stub(vscode.commands, 'registerCommand');
    connectionHandler = sandbox.createStubInstance(StdioConnectionHandler);
    Object.defineProperty(connectionHandler, 'languageClient', { value: { sendRequest: () => { } } });
    Object.defineProperty(connectionHandler, 'status', { writable: true, value: ConnectionStatus.RunningLoaded });
    puppetResourceFeature = new PuppetResourceFeature(context, connectionHandler, logger);
    // define a promise that resolves when documentChanged is called
    documentChanged = new Promise<void>(resolve => {
      resolveDocumentChanged = resolve;
    });
    // Create a stub for the editCurrentDocument method that resolves documentChanged
    editCurrentDocumentStub = sandbox.stub(puppetResourceFeature, 'editCurrentDocument').callsFake(() => {
      resolveDocumentChanged();
    });
  });

  afterEach(() => {
    puppetResourceFeature.dispose();
    sandbox.restore();
  });

  it('run should show information message when language server is not ready', () => {
    Object.defineProperty(connectionHandler, 'status', { value: ConnectionStatus.NotStarted });
    const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');
    puppetResourceFeature.run();
    assert.isTrue(showInformationMessageStub.calledWith('Puppet Resource is not available as the Language Server is not ready'));
  });

  it('run should not proceed when no resource name is provided', () => {
    sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
    puppetResourceFeature.run();
    assert.isTrue(editCurrentDocumentStub.notCalled);
  });

  it('run should call editCurrentDocument when resourceResult.data is not empty', async () => {
    sandbox.stub(vscode.window, 'showInputBox').resolves('test-resource');
    sandbox.stub(connectionHandler.languageClient, 'sendRequest').resolves({ data: 'test-data', error: undefined});
    puppetResourceFeature.run();
    await documentChanged;
    sandbox.assert.calledOnce(editCurrentDocumentStub);
    assert.include(editCurrentDocumentStub.args[0][1], 'test-data');
  });

  it('run should log error when resourceResult.error is not empty', () => {
    sandbox.stub(vscode.window, 'showInputBox').resolves('test-resource');
    sandbox.stub(connectionHandler.languageClient, 'sendRequest').resolves({ data: undefined, error: 'test-error' });
    puppetResourceFeature.run();
    sandbox.assert.notCalled(editCurrentDocumentStub);
  });
});
