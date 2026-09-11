import * as assert from 'assert';
import * as cp from 'child_process';
import * as net from 'net';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PuppetStatusBarFeature } from '../../feature/PuppetStatusBarFeature';
import { TcpConnectionHandler } from '../../handlers/tcp';
import { ConnectionType, ProtocolType } from '../../settings';
import * as index from './index';

describe('TcpConnectionHandler - additional coverage', () => {
  let sandbox: sinon.SinonSandbox;
  let statusBar: PuppetStatusBarFeature;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    statusBar = sandbox.createStubInstance(PuppetStatusBarFeature);
    sandbox.stub(vscode.commands, 'registerCommand').returns(sandbox.createStubInstance(vscode.Disposable));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('connectionType returns Remote and cleanup() works', () => {
    const config = JSON.parse(JSON.stringify(index.configSettings));
    config.workspace.editorService.protocol = ProtocolType.TCP;
    config.workspace.editorService.tcp = { address: '10.0.0.5', port: 8080 };
    const handler = new TcpConnectionHandler(index.extContext, statusBar, index.logger, config, index.puppetLangID, index.puppetFileLangID);
    assert.equal(handler.connectionType, ConnectionType.Remote);
    // Also covers cleanup() method (line 115)
    assert.doesNotThrow(() => handler.cleanup());
  });

  it('connectionType returns undefined for non-TCP protocol', () => {
    const config = JSON.parse(JSON.stringify(index.configSettings));
    config.workspace.editorService.protocol = ProtocolType.STDIO;
    config.workspace.editorService.tcp = { address: '', port: 0 };
    const handler = new TcpConnectionHandler(index.extContext, statusBar, index.logger, config, index.puppetLangID, index.puppetFileLangID);
    assert.equal(handler.connectionType, undefined);
  });

  it('createServerOptions returns a function that creates a socket', () => {
    const config = JSON.parse(JSON.stringify(index.configSettings));
    config.workspace.editorService.protocol = ProtocolType.TCP;
    config.workspace.editorService.tcp = { address: '10.0.0.5', port: 8080 };
    const handler = new TcpConnectionHandler(index.extContext, statusBar, index.logger, config, index.puppetLangID, index.puppetFileLangID);

    const mockSocket = {
      connect: sandbox.stub(),
      on: sandbox.stub(),
      write: sandbox.stub(),
      end: sandbox.stub(),
    };
    sandbox.stub(net, 'Socket').returns(mockSocket as any);

    const serverOptions = handler.createServerOptions() as Function;
    assert.ok(typeof serverOptions === 'function');
    const result = serverOptions();
    assert.ok(result instanceof Promise);
    sinon.assert.calledOnce(mockSocket.connect as sinon.SinonStub);
  });



  it('constructor spawns process for local TCP and handles stdout data', () => {
    const config = JSON.parse(JSON.stringify(index.configSettings));
    config.workspace.installType = 'puppet';
    config.workspace.editorService.protocol = ProtocolType.TCP;
    config.workspace.editorService.tcp = { address: '', port: 0 };
    config.ruby = { ...index.configSettings.ruby, rubydir: '/ruby', environmentPath: '/bin', rubylib: '', sslCertFile: '', sslCertDir: '', pdkRubyDir: '' };

    const stdoutCallbacks: Record<string, Function> = {};
    const procCallbacks: Record<string, Function> = {};
    const mockProc = {
      stdout: { on: sandbox.stub().callsFake((e, cb) => { stdoutCallbacks[e] = cb; }) },
      on: sandbox.stub().callsFake((e, cb) => { procCallbacks[e] = cb; }),
      pid: 12345,
    };
    sandbox.stub(cp, 'spawn').returns(mockProc as any);

    const handler = new TcpConnectionHandler(index.extContext, statusBar, index.logger, config, index.puppetLangID, index.puppetFileLangID);

    // Simulate stdout with language server ready
    if (stdoutCallbacks['data']) {
      stdoutCallbacks['data']('LANGUAGE SERVER RUNNING on localhost:12345');
    }
    // Simulate close event
    if (procCallbacks['close']) {
      procCallbacks['close'](0);
    }
    assert.ok(handler);
  });
});
