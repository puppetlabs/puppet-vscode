import * as assert from 'assert';
import { before, teardown } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { UpdateConfigurationFeature } from '../../../feature/UpdateConfigurationFeature';
import { ILogger } from '../../../logging';
import * as index from '../index';

suite('UpdateConfigurationFeature Test Suite', () => {
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

  teardown(() => {
    sandbox.restore();
  });

  test('Updates a configuration setting', async () => {
    const updateSettingsHash = { 'puppet.editorService.loglevel': 'debug' };
    const mockConfig = {
      update: sandbox.stub(),
    };
    getConfigurationSpy.returns(mockConfig);
    await (updateConfigFeature as any)['updateSettingsAsync'](updateSettingsHash);
    assert(getConfigurationSpy.calledOnce);
    assert(mockConfig.update.calledWith('puppet.editorService.loglevel', 'debug'));
  });

  test('Prompts for restart if necessary', async () => {
    const updateSettingsHash = { 'puppet.editorService.puppet.version': '7.0.0' };
    showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').returns(Promise.resolve('Yes'));
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
    await (updateConfigFeature as any)['updateSettingsAsync'](updateSettingsHash);
    assert(showInformationMessageStub.calledWith('Puppet extensions needs to restart the editor. Would you like to do that now?'));
    assert(executeCommandStub.calledWith('workbench.action.reloadWindow'));
  });

  test('Does not prompt for restart if not necessary', async () => {
    const updateSettingsHash = { 'editor.tabSize': 2 };
    showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage').returns(Promise.resolve('No'));
    await (updateConfigFeature as any)['updateSettingsAsync'](updateSettingsHash);
    assert(showInformationMessageStub.notCalled);
  });

  test('Disposes correctly', () => {
    assert.doesNotThrow(() => {
      updateConfigFeature.dispose();
    });
  });
});
