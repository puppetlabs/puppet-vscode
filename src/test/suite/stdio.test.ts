import * as assert from 'assert';
import { after, before, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PuppetStatusBarFeature } from '../../feature/PuppetStatusBarFeature';
import { StdioConnectionHandler } from '../../handlers/stdio';
import { PuppetInstallType } from '../../settings';
import * as index from './index';

describe('StdioConnectionHandler - createServerOptions switch cases', () => {
  let sandbox: sinon.SinonSandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(vscode.commands, 'registerCommand').returns(sandbox.createStubInstance(vscode.Disposable));
  });

  after(() => {
    sandbox.restore();
  });

  it('createServerOptions logs PDK env vars when installType is PDK', () => {
    const config = JSON.parse(JSON.stringify(index.configSettings));
    config.workspace.installType = PuppetInstallType.PDK;
    config.ruby = {
      ...index.configSettings.ruby,
      pdkRubyDir: '/pdk/ruby',
      pdkRubyBinDir: '/pdk/ruby/bin',
      environmentPath: '/pdk/bin',
      rubylib: '/pdk/lib',
      sslCertFile: '',
      sslCertDir: '',
      puppetBaseDir: '/pdk',
      rubydir: '/pdk/ruby',
    };
    const statusBar = sandbox.createStubInstance(PuppetStatusBarFeature);
    const handler = new StdioConnectionHandler(
      index.extContext, statusBar, index.logger, config,
      index.puppetLangID, index.puppetFileLangID
    );
    const serverOptions = handler.createServerOptions();
    assert.ok(serverOptions);
  });
});
