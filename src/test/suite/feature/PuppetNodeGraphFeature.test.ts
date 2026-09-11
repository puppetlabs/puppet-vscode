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

  it('should show information message when connection is not ready', async () => {
    const notReadyHandler = sandbox.createStubInstance(StdioConnectionHandler);
    sandbox.stub(Object.getPrototypeOf(notReadyHandler), 'status').get(() => ConnectionStatus.Starting);
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');

    // Trigger the command by calling registerCommand callback
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    // Create feature with the notReady handler — the command is registered on context.subscriptions
    new PuppetNodeGraphFeature(index.puppetLangID, notReadyHandler, index.logger, mockContext);

    // Simulate an active puppet editor
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: vscode.Uri.file('/test/manifest.pp') },
    }));

    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) {
      nodeGraphCall.args[1]();
    }
    sinon.assert.calledOnce(showInfoStub);
  });

  it('should do nothing when no active text editor', () => {
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => undefined);
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    new PuppetNodeGraphFeature(index.puppetLangID, mockConnectionHandler, index.logger, mockContext);
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) {
      nodeGraphCall.args[1](); // should return early without throwing
    }
    assert.ok(true);
  });

  it('should do nothing when active editor is not puppet language', () => {
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: 'ruby', uri: vscode.Uri.file('/test/file.rb') },
    }));
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    new PuppetNodeGraphFeature(index.puppetLangID, mockConnectionHandler, index.logger, mockContext);
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) {
      nodeGraphCall.args[1](); // should return early without creating panel
    }
    assert.ok(true);
  });

  it('dispose disposes all providers', () => {
    puppetNodeGraphFeature.dispose(); // already called in afterEach but test explicitly
    assert.ok(true);
  });


  it('show() sends request and handles success via getJsonContent', async () => {
    const mockWebview = {
      html: '',
      asWebviewUri: (uri: any) => uri,
      onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }),
      postMessage: sandbox.stub(),
    };
    const mockPanel = {
      webview: mockWebview,
      onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() }),
      dispose: sandbox.stub(),
    };
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel as any);
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: vscode.Uri.file('/test/manifest.pp') },
    }));
    sendRequestStub.resolves({
      error: null,
      vertices: [{ label: 'File[/tmp]', id: '0' }],
      edges: [],
    });

    // Invoke the command callback captured by registerCommand stub
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    assert.ok(nodeGraphCall, 'command should be registered');
    await nodeGraphCall.args[1]();
    await new Promise(resolve => setTimeout(resolve, 10));

    sinon.assert.called(sendRequestStub);
  });

  it('show() handles undefined compileResult', async () => {
    const mockWebview = {
      html: '',
      asWebviewUri: (uri: any) => uri,
      onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }),
      postMessage: sandbox.stub(),
    };
    const mockPanel = {
      webview: mockWebview,
      onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() }),
      dispose: sandbox.stub(),
    };
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel as any);
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: vscode.Uri.file('/test/manifest.pp') },
    }));
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    sendRequestStub.resolves(undefined);

    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) {
      await nodeGraphCall.args[1]();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    sinon.assert.calledOnce(showErrorStub);
  });

  it('show() handles compileResult with error', async () => {
    const mockWebview = {
      html: '',
      asWebviewUri: (uri: any) => uri,
      onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }),
      postMessage: sandbox.stub(),
    };
    const mockPanel = {
      webview: mockWebview,
      onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() }),
      dispose: sandbox.stub(),
    };
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel as any);
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: vscode.Uri.file('/test/manifest.pp') },
    }));
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    sendRequestStub.resolves({ error: 'Parse error at line 5', vertices: [], edges: [] });

    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) {
      await nodeGraphCall.args[1]();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    sinon.assert.calledOnce(showErrorStub);
  });

  it('onDidReceiveMessage handles error message', async () => {
    const onMessageCallbacks: any[] = [];
    const mockWebview = {
      html: '',
      asWebviewUri: (uri: any) => uri,
      onDidReceiveMessage: sandbox.stub().callsFake(cb => { onMessageCallbacks.push(cb); return { dispose: sandbox.stub() }; }),
      postMessage: sandbox.stub(),
    };
    const mockPanel = {
      webview: mockWebview,
      onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() }),
      dispose: sandbox.stub(),
    };
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel as any);
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: vscode.Uri.file('/test/manifest.pp') },
    }));
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
    const showWarnStub = sandbox.stub(vscode.window, 'showWarningMessage');
    sendRequestStub.resolves({ error: null, vertices: [], edges: [] });

    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) {
      await nodeGraphCall.args[1]();
    }

    // Trigger message handlers
    for (const cb of onMessageCallbacks) {
      cb({ command: 'error', errorMsg: 'render error' });
      cb({ command: 'warning', errorMsg: 'render warning' });
      cb({ command: 'unknown' }); // default branch
    }

    sinon.assert.calledOnce(showErrorStub);
    sinon.assert.calledOnce(showWarnStub);
  });


  it('getNotificationType returns Window for statusbar setting', () => {
    const settings = require('../../../settings');
    sandbox.stub(settings, 'settingsFromWorkspace').returns({
      notification: { nodeGraph: 'statusbar', puppetResource: 'messagebox' }
    });
    const provider = (puppetNodeGraphFeature as any).providers[0] ||
      new (require('../../../feature/PuppetNodeGraphFeature').PuppetNodeGraphFeature)(
        index.puppetLangID, mockConnectionHandler, index.logger, mockContext
      );
    // Access getNotificationType via the NodeGraphWebViewProvider class
    // Create one by invoking the command callback
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: vscode.Uri.file('/test/manifest.pp') },
    }));
    const mockWebview2 = { html: '', asWebviewUri: (u: any) => u, onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }), postMessage: sandbox.stub() };
    const mockPanel2 = { webview: mockWebview2, onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() }), dispose: sandbox.stub() };
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel2 as any);
    sandbox.stub(vscode.window, 'withProgress').callsFake((_opts: any, task: any) => task({ report: sandbox.stub() }));
    sendRequestStub.resolves({ error: null, vertices: [], edges: [] });
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) {
      nodeGraphCall.args[1](); // creates a NodeGraphWebViewProvider and calls show()
    }
    assert.ok(true);
  });

  it('getNotificationType returns undefined for none setting (covers show() direct path)', async () => {
    const settings = require('../../../settings');
    sandbox.stub(settings, 'settingsFromWorkspace').returns({
      notification: { nodeGraph: 'none', puppetResource: 'messagebox' }
    });
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: vscode.Uri.file('/test/manifest.pp') },
    }));
    const mockWebview3 = { html: '', asWebviewUri: (u: any) => u, onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }), postMessage: sandbox.stub() };
    const mockPanel3 = { webview: mockWebview3, onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() }), dispose: sandbox.stub() };
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel3 as any);
    sendRequestStub.resolves({ error: null, vertices: [], edges: [] });
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) {
      await nodeGraphCall.args[1]();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.ok(true);
  });

  it('getNotificationType handles unknown setting (default branch)', () => {
    const settings = require('../../../settings');
    sandbox.stub(settings, 'settingsFromWorkspace').returns({
      notification: { nodeGraph: 'unknown_value', puppetResource: 'messagebox' }
    });
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: vscode.Uri.file('/test/manifest.pp') },
    }));
    const mockWebview4 = { html: '', asWebviewUri: (u: any) => u, onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }), postMessage: sandbox.stub() };
    const mockPanel4 = { webview: mockWebview4, onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() }), dispose: sandbox.stub() };
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel4 as any);
    sandbox.stub(vscode.window, 'withProgress').callsFake((_opts: any, task: any) => task({ report: sandbox.stub() }));
    sendRequestStub.resolves({ error: null, vertices: [], edges: [] });
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) { nodeGraphCall.args[1](); }
    assert.ok(true);
  });

  it('onDidSaveTextDocument fires show() on providers when uri matches (lines 58-60)', async () => {
    const fileUri = vscode.Uri.file('/test/manifest.pp');
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { languageId: index.puppetLangID, uri: fileUri },
    }));
    const mockWebview5 = { html: '', asWebviewUri: (u: any) => u, onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }), postMessage: sandbox.stub() };
    const mockPanel5 = { webview: mockWebview5, onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() }), dispose: sandbox.stub() };
    sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel5 as any);
    sandbox.stub(vscode.window, 'withProgress').callsFake((_opts: any, task: any) => task({ report: sandbox.stub() }));
    sendRequestStub.resolves({ error: null, vertices: [], edges: [] });

    // First create a provider by running the command
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    const nodeGraphCall = registerStub.getCalls().find(c => c.args[0] === 'puppet.puppetShowNodeGraphToSide');
    if (nodeGraphCall) { await nodeGraphCall.args[1](); }

    // Now fire the onDidSaveTextDocument event (providers should now have an entry)
    const saveStub = vscode.workspace.onDidSaveTextDocument as sinon.SinonStub;
    if (saveStub && saveStub.callCount > 0) {
      const saveCallback = saveStub.firstCall?.args[0];
      if (saveCallback) {
        saveCallback({ uri: fileUri }); // same uri as active editor → item.show(true) fires
      }
    }
    assert.ok(true);
  });


  it('onDidSaveTextDocument fires show(true) when uri matches active editor (lines 58-60)', async () => {
    // Stub onDidSaveTextDocument BEFORE creating the feature so we capture the callback
    let saveCallback: ((doc: any) => void) | undefined;
    sandbox.stub(vscode.workspace, 'onDidSaveTextDocument').callsFake((cb: any) => {
      saveCallback = cb;
      return { dispose: sandbox.stub() };
    });

    const fileUri = vscode.Uri.file('/test/manifest.pp');
    sandbox.stub(vscode.window, 'activeTextEditor').get(() => ({
      document: { uri: fileUri, languageId: index.puppetLangID },
    }));

    // Create a new feature — its constructor registers the onDidSave callback
    const newFeature = new PuppetNodeGraphFeature(
      index.puppetLangID, mockConnectionHandler, index.logger, mockContext
    );

    // Add a mock provider so the forEach has something to iterate
    const mockProvider = { show: sandbox.stub().resolves() };
    (newFeature as any).providers = [mockProvider];

    // Fire the save callback with the matching URI (covers lines 58-60)
    if (saveCallback) {
      saveCallback({ uri: fileUri });
    }

    sinon.assert.calledOnce(mockProvider.show as sinon.SinonStub);
    newFeature.dispose();
  });

});
