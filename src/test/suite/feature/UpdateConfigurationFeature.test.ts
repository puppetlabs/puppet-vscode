import * as assert from 'assert';
import { afterEach, before, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { UpdateConfigurationFeature } from '../../../feature/UpdateConfigurationFeature';
import { ILogger } from '../../../logging';
import * as index from '../index';

describe('UpdateConfigurationFeature', () => {
  let updateConfigFeature: UpdateConfigurationFeature;
  let mockLogger: ILogger;
  let mockContext: vscode.ExtensionContext;
  let registerCommandStub: sinon.SinonStub;
  let getConfigurationSpy: sinon.SinonSpy;
  let sandbox: sinon.SinonSandbox;
  let showInformationMessageStub: sinon.SinonStub;

  before(() => {
    sandbox = sinon.createSandbox();
    mockLogger = index.logger;
    mockContext = index.extContext;
    registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand');
    updateConfigFeature = new UpdateConfigurationFeature(mockLogger, mockContext);
    getConfigurationSpy = sandbox.stub(vscode.workspace, 'getConfiguration');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Updates a configuration setting', async () => {
    const updateSettingsHash = { 'puppet.editorService.loglevel': 'debug' };
    const mockConfig = {
      update: sandbox.stub(),
    };
    getConfigurationSpy.returns(mockConfig);
    await (updateConfigFeature as any)['updateSettingsAsync'](updateSettingsHash);
    assert(getConfigurationSpy.calledOnce);
    assert(mockConfig.update.calledWith('puppet.editorService.loglevel', 'debug'));
  });

  it('Prompts for restart if necessary', async () => {
    const updateSettingsHash = { 'puppet.editorService.puppet.version': '7.0.0' };
    showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').returns(Promise.resolve('Yes'));
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
    await (updateConfigFeature as any)['updateSettingsAsync'](updateSettingsHash);
    assert(showInformationMessageStub.calledWith('Puppet extensions needs to restart the editor. Would you like to do that now?'));
    assert(executeCommandStub.calledWith('workbench.action.reloadWindow'));
  });

  it('Does not prompt for restart if not necessary', async () => {
    const updateSettingsHash = { 'editor.tabSize': 2 };
    showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').returns(Promise.resolve('No'));
    await (updateConfigFeature as any)['updateSettingsAsync'](updateSettingsHash);
    assert(showInformationMessageStub.notCalled);
  });

  it('Disposes correctly', () => {
    assert.doesNotThrow(() => {
      updateConfigFeature.dispose();
    });
  });
});
