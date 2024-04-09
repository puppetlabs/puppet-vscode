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
});
