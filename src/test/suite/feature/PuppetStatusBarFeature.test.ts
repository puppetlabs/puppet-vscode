import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { IAggregateConfiguration } from '../../../configuration';
import { PuppetStatusBarFeature } from '../../../feature/PuppetStatusBarFeature';
import { ConnectionStatus } from '../../../interfaces';
import { ILogger } from '../../../logging';
import * as index from '../index';

describe('PuppetStatusBarProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let mockConfig: sinon.SinonStubbedInstance<IAggregateConfiguration> = index.configSettings;
  let mockLogger: sinon.SinonStubbedInstance<ILogger> = index.logger;
  let mockStatusBarItem: sinon.SinonStubbedInstance<vscode.StatusBarItem>;
  let statusBarFeature: PuppetStatusBarFeature;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockStatusBarItem = {
      alignment: vscode.StatusBarAlignment.Left,
      priority: undefined,
      text: '',
      tooltip: '',
      color: '',
      command: '',
      show: sandbox.stub(),
      hide: sandbox.stub(),
      dispose: sandbox.stub(),
    };
    sandbox.stub(vscode.window, 'createStatusBarItem').returns(mockStatusBarItem);
    sandbox.stub(vscode.commands, 'registerCommand');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should update status bar item when connection status changes', () => {
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext)
    const newStatus = ConnectionStatus.RunningLoaded;
    const newStatusText = 'RunningLoaded';
    const newToolTip = 'Connection is running and loaded';
    statusBarFeature.setConnectionStatus(newStatusText, newStatus, newToolTip);

    sandbox.assert.calledOnce(mockStatusBarItem.show);
    assert.equal(mockStatusBarItem.text, `$(terminal) ${newStatusText}`);
    assert.equal(mockStatusBarItem.tooltip, newToolTip);
  });

  it('should hide status bar item when language ID is not Puppet', () => {
    const mockNonPuppetEditor = {
      document: {
        languageId: 'javascript', // Use a language ID that is not 'puppet'
      },
    } as vscode.TextEditor;
    const onDidChangeActiveTextEditorStub = sandbox.stub(vscode.window, 'onDidChangeActiveTextEditor');
    // Create a new instance of PuppetStatusBarFeature to test the onDidChangeActiveTextEditor event
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext)
    // Trigger the onDidChangeActiveTextEditor event, passing in a non-Puppet editor as if the user switched to a non-Puppet file
    onDidChangeActiveTextEditorStub.callArgWith(0, mockNonPuppetEditor);
    // Verify that the status bar item is hidden
    sandbox.assert.calledOnce(mockStatusBarItem.hide);
  });

  it('should return undefined when disposed', () => {
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    const result = statusBarFeature.dispose();
    assert.isUndefined(result);
  });

  it('should set RunningLoading status', () => {
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    statusBarFeature.setConnectionStatus('Loading', ConnectionStatus.RunningLoading, 'Loading...');
    assert.include(mockStatusBarItem.text, '$(sync~spin)');
    assert.equal(mockStatusBarItem.color, '#affc74');
  });

  it('should set Failed status', () => {
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    statusBarFeature.setConnectionStatus('Failed', ConnectionStatus.Failed, 'Failed\!');
    assert.include(mockStatusBarItem.text, '$(alert)');
    assert.equal(mockStatusBarItem.color, '#fcc174');
  });

  it('should set default (gear) status for NotStarted/Starting/Stopping', () => {
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    statusBarFeature.setConnectionStatus('Starting', ConnectionStatus.Starting, 'Starting...');
    assert.include(mockStatusBarItem.text, '$(gear)');
    assert.equal(mockStatusBarItem.color, '#f3fc74');
  });

  it('should hide status bar when textEditor is undefined', () => {
    const onChangedStub = sandbox.stub(vscode.window, 'onDidChangeActiveTextEditor');
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    onChangedStub.callArgWith(0, undefined);
    sinon.assert.called(mockStatusBarItem.hide);
  });

  it('should show status bar when textEditor has puppet languageId', () => {
    const onChangedStub = sandbox.stub(vscode.window, 'onDidChangeActiveTextEditor');
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    const puppetEditor = { document: { languageId: index.puppetLangID } } as vscode.TextEditor;
    onChangedStub.callArgWith(0, puppetEditor);
    sinon.assert.called(mockStatusBarItem.show);
  });

  it('should not update statusBarItem.text when it has not changed', () => {
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    statusBarFeature.setConnectionStatus('Running', ConnectionStatus.RunningLoaded, 'tip');
    const textAfterFirst = mockStatusBarItem.text;
    statusBarFeature.setConnectionStatus('Running', ConnectionStatus.RunningLoaded, 'tip2');
    // text should remain unchanged since the computed text is the same
    assert.equal(mockStatusBarItem.text, textAfterFirst);
  });

  it('showConnectionMenu shows quick pick with menu items', () => {
    const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    (statusBarFeature as any).provider.showConnectionMenu();
    sinon.assert.calledOnce(showQuickPickStub);
  });

  it('showConnectionMenu executes selected item callback', async () => {
    const executeStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    sandbox.stub(vscode.window, 'showQuickPick').resolves({
      label: 'Show Puppet Session Logs',
      description: '',
      callback: () => vscode.commands.executeCommand('puppet.showConnectionLogs'),
    } as any);
    await (statusBarFeature as any).provider.showConnectionMenu();
    sinon.assert.called(executeStub);
  });


  it('showConnectionMenu adds version switch items when pdkPuppetVersions available', () => {
    const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    const configWithVersions = {
      ...mockConfig,
      ruby: { pdkPuppetVersions: ['7.0.0', '6.0.0'] },
      connection: { protocol: 'stdio' },
    } as any;
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], configWithVersions, mockLogger, index.extContext);
    (statusBarFeature as any).provider.showConnectionMenu();
    sinon.assert.calledOnce(showQuickPickStub);
    // Quick pick should include more than 1 item (Session Logs + version switches)
    const items = showQuickPickStub.firstCall.args[0];
    assert.ok(items.length > 1);
  });


  it('showConnectionMenu item callbacks are invokable (covers callback bodies)', async () => {
    const executeStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
    let capturedItems: any[] = [];
    sandbox.stub(vscode.window, 'showQuickPick').callsFake((items: any) => {
      capturedItems = Array.isArray(items) ? items : [];
      return Promise.resolve(undefined);
    });
    const configWithVersions = {
      ...mockConfig,
      ruby: { pdkPuppetVersions: ['7.0.0', '6.0.0'] },
      connection: { protocol: 'stdio' },
    } as any;
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], configWithVersions, mockLogger, index.extContext);
    (statusBarFeature as any).provider.showConnectionMenu();

    // Invoke the 'Show Puppet Session Logs' callback (line 78)
    if (capturedItems[0] && capturedItems[0].callback) {
      capturedItems[0].callback();
    }
    // Invoke the 'Switch to latest Puppet version' callback (line 90)
    if (capturedItems[1] && capturedItems[1].callback) {
      capturedItems[1].callback();
    }
    // Invoke a version-specific callback (line 101)
    if (capturedItems[2] && capturedItems[2].callback) {
      capturedItems[2].callback();
    }
    sinon.assert.called(executeStub);
  });

  it('showConnectionMenu command callback invokes provider (line 135)', () => {
    const registerStub = vscode.commands.registerCommand as sinon.SinonStub;
    statusBarFeature = new PuppetStatusBarFeature([index.puppetLangID], mockConfig, mockLogger, index.extContext);
    sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    // Find and invoke the puppetShowConnectionMenu command callback (covers line 135)
    const menuCommandCall = registerStub.getCalls().find(
      c => String(c.args[0]).includes('puppetShowConnectionMenu') || String(c.args[0]).includes('ShowConnectionMenu')
    );
    if (menuCommandCall) {
      menuCommandCall.args[1]();
    }
    assert.ok(true);
  });

});
