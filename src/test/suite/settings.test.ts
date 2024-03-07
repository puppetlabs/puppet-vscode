import * as assert from 'assert';
import * as settings from '../../settings';

import * as vscode from 'vscode';
import * as index from './index';

suite('Settings Tests', () => {
  const workspaceConfigurationStub = {
    get: index.sandbox.stub(),
    has: index.sandbox.stub(),
    inspect: index.sandbox.stub(),
    update: index.sandbox.stub(),
  };

  index.sandbox.stub(vscode.workspace, 'getConfiguration').returns(workspaceConfigurationStub);

  const editorServiceSettings: settings.IEditorServiceSettings = {
    enable: false,
    timeout: 50,
  };
  const pdkSettings: settings.IPDKSettings = {
    checkVersion: false,
  };
  workspaceConfigurationStub.get.withArgs('editorService').returns(editorServiceSettings);
  workspaceConfigurationStub.get.withArgs('pdk').returns(pdkSettings);

  test('Default settings are populated', () => {
    const defaultWorkspaceSettings = index.settings;
    assert.notStrictEqual(defaultWorkspaceSettings, undefined);
  });

  test('Retrieves settings from workspace', () => {
    const workspaceSettings = settings.settingsFromWorkspace();
    assert.notStrictEqual(workspaceSettings, undefined);
    assert.strictEqual(workspaceSettings.editorService.enable, false);
    assert.strictEqual(workspaceSettings.editorService.timeout, 50);
    assert.strictEqual(workspaceSettings.pdk.checkVersion, false);
  });
});
