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

  it('warns when installDirectory is set with installType AUTO', () => {
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves(undefined);
    // Reset stub to return specific values
    workspaceConfigurationStub.get.reset();
    workspaceConfigurationStub.get.callsFake((key: string, defaultVal: any) => {
      if (key === 'installDirectory') { return '/custom/puppet'; }
      if (key === 'installType') { return 'auto'; }
      return defaultVal;
    });
    settings.settingsFromWorkspace();
    sinon.assert.calledOnce(showErrorStub);
  });

  it('getSafeWorkspaceConfig handles missing indexes gracefully', () => {
    // settingsFromWorkspace initialises editorService/featureFlags/puppet/tcp guards
    workspaceConfigurationStub.get.withArgs('editorService', sinon.match.any).returns(undefined);
    const result = settings.settingsFromWorkspace();
    assert.ok(result.editorService);
    assert.ok(Array.isArray(result.editorService.featureFlags));
  });

});


describe('Settings - installDirectory warning (fresh sandbox)', () => {
  it('warns when installDirectory set with AUTO installType', () => {
    const sb = sinon.createSandbox();
    try {
      const showErrorStub = sb.stub(vscode.window, 'showErrorMessage').resolves(undefined);
      const mockConfig = {
        get: sb.stub().callsFake((key: string, defaultVal: any) => {
          if (key === 'installDirectory') { return '/custom/puppet'; }
          if (key === 'installType') { return 'auto'; }
          return defaultVal;
        }),
        has: sb.stub(), inspect: sb.stub(), update: sb.stub(),
      };
      sb.stub(vscode.workspace, 'getConfiguration').returns(mockConfig as any);
      settings.settingsFromWorkspace();
      sinon.assert.calledOnce(showErrorStub);
    } finally {
      sb.restore();
    }
  });
});
