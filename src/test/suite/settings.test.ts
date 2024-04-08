import * as assert from 'assert';
import * as settings from '../../settings';

import { after, before, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as index from './index';

let sandbox: sinon.SinonSandbox;
let workspaceConfigurationStub: sinon.SinonStubbedInstance<vscode.WorkspaceConfiguration>;

describe('Settings Tests', () => {

  before(() => {
    sandbox = sinon.createSandbox();
    workspaceConfigurationStub = {
      get: sandbox.stub(),
      has: sandbox.stub(),
      inspect: sandbox.stub(),
      update: sandbox.stub(),
    };
    sandbox.stub(vscode.workspace, 'getConfiguration').returns(workspaceConfigurationStub);
  });

  after(() => {
    sandbox.restore();
  });

  it('Default settings are populated', () => {
    const defaultWorkspaceSettings = index.defaultSettings;
    assert.notStrictEqual(defaultWorkspaceSettings, undefined);
  });

  it('Retrieves settings from workspace', () => {
    let editorServiceSettings: settings.IEditorServiceSettings = {
      enable: false,
      timeout: 50,
    };
    let pdkSettings: settings.IPDKSettings = {
      checkVersion: false,
    };
    workspaceConfigurationStub.get.withArgs('editorService').returns(editorServiceSettings);
    workspaceConfigurationStub.get.withArgs('pdk').returns(pdkSettings);
    const workspaceSettings = settings.settingsFromWorkspace();
    assert.notStrictEqual(workspaceSettings, undefined);
    assert.strictEqual(workspaceSettings.editorService.enable, false);
    assert.strictEqual(workspaceSettings.editorService.timeout, 50);
    assert.strictEqual(workspaceSettings.pdk.checkVersion, false);
  });
});
