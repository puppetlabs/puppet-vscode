
import * as assert from 'assert';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CommandEnvironmentHelper } from '../../helpers/commandHelper';
import { ConnectionType, ProtocolType, PuppetInstallType } from '../../settings';
import * as index from './index';

describe('CommandEnvironmentHelper', () => {
  let sandbox: sinon.SinonSandbox;
  let baseConfig: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    baseConfig = {
      workspace: {
        installType: PuppetInstallType.PUPPET,
        editorService: {
          protocol: ProtocolType.STDIO,
          timeout: 10,
          tcp: { address: '', port: 0 },
          puppet: { confdir: '', environment: '', modulePath: '', vardir: '', version: '' },
          debugFilePath: '',
        },
        format: { enable: true },
      },
      ruby: {
        pdkRubyDir: '/pdk/ruby',
        rubydir: '/puppet/ruby',
        environmentPath: '/puppet/bin',
        rubylib: '/puppet/lib',
        sslCertFile: '/ssl/cert.pem',
        sslCertDir: '/ssl/certs',
        puppetBaseDir: '/pdk',
        pdkPuppetVersions: [],
      },
      connection: { protocol: ProtocolType.STDIO },
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('builds PUPPET environment variables', () => {
    const exe = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration('/lang-server.rb', baseConfig);
    assert.equal(exe.options.env.RUBYOPT, '-rrubygems');
    assert.equal(exe.options.env.SSL_CERT_FILE, '/ssl/cert.pem');
    assert.equal(exe.options.env.SSL_CERT_DIR, '/ssl/certs');
  });

  it('builds PDK environment variables', () => {
    baseConfig.workspace.installType = PuppetInstallType.PDK;
    const exe = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration('/lang-server.rb', baseConfig);
    assert.equal(exe.options.env.DEVKIT_BASEDIR, '/pdk');
    assert.equal(exe.options.env.RUBY_DIR, '/pdk/ruby');
  });

  it('builds TCP args with non-empty address', () => {
    baseConfig.workspace.editorService.protocol = ProtocolType.TCP;
    baseConfig.workspace.editorService.tcp.address = '192.168.1.100';
    baseConfig.workspace.editorService.tcp.port = 8080;
    const exe = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration('/lang-server.rb', baseConfig);
    assert.ok(exe.args.some(a => a.includes('--ip=192.168.1.100')));
    assert.ok(exe.args.some(a => a.includes('--port=8080')));
  });

  it('builds TCP args with empty address defaults to 127.0.0.1', () => {
    baseConfig.workspace.editorService.protocol = ProtocolType.TCP;
    baseConfig.workspace.editorService.tcp.address = '';
    baseConfig.workspace.editorService.tcp.port = 0;
    const exe = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration('/lang-server.rb', baseConfig);
    assert.ok(exe.args.some(a => a.includes('--ip=127.0.0.1')));
  });

  it('builds debug server args', () => {
    const exe = CommandEnvironmentHelper.getDebugServerRubyEnvFromConfiguration('/debug-server.rb', baseConfig);
    assert.ok(exe.args.some(a => a.includes('--ip=127.0.0.1')));
  });

  it('appends puppet-settings when puppet settings are defined', () => {
    baseConfig.workspace.editorService.puppet.environment = 'production';
    baseConfig.workspace.editorService.puppet.modulePath = '/modules';
    const exe = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration('/lang-server.rb', baseConfig);
    assert.ok(exe.args.some(a => a.startsWith('--puppet-settings=')));
  });

  it('appends puppet-version when defined', () => {
    baseConfig.workspace.editorService.puppet.version = '7.0.0';
    const exe = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration('/lang-server.rb', baseConfig);
    assert.ok(exe.args.some(a => a.includes('--puppet-version=7.0.0')));
  });

  it('appends debug file path when defined', () => {
    baseConfig.workspace.editorService.debugFilePath = '/tmp/puppet-debug.log';
    const exe = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration('/lang-server.rb', baseConfig);
    assert.ok(exe.args.some(a => a.includes('--debug=/tmp/puppet-debug.log')));
  });

  it('shallowCloneObject copies own properties', () => {
    const obj = { a: 1, b: 'two', c: null };
    const clone = CommandEnvironmentHelper.shallowCloneObject(obj);
    assert.deepEqual(clone, obj);
    assert.notEqual(clone, obj);
  });

  it('removeEmptyElements strips null and undefined values', () => {
    const obj = { a: 'keep', b: null, c: undefined, d: 0 };
    CommandEnvironmentHelper.removeEmptyElements(obj);
    assert.ok('a' in obj);
    assert.ok(!('b' in obj));
    assert.ok(!('c' in obj));
    assert.ok('d' in obj);
  });

  it('cleanEnvironmentPath handles undefined PATH by scanning env keys case-insensitively', () => {
    const exe = {
      options: {
        env: {
          Path: '/usr/local/bin', // mixed-case, not PATH
          RUBYLIB: undefined,
        },
      },
      command: '',
      args: [],
    } as any;
    CommandEnvironmentHelper.cleanEnvironmentPath(exe);
    // PATH should be set from the Path key value, Path key should be undefined
    assert.equal(exe.options.env.PATH, '/usr/local/bin');
    assert.strictEqual(exe.options.env.Path, undefined);
  });

  it('buildLanguageServerArguments includes workspace folder path when available', () => {
    const fakeUri = vscode.Uri.file('/fake/workspace');
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([{ uri: fakeUri, name: 'fake', index: 0 }]);
    const exe = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration('/lang-server.rb', baseConfig);
    assert.ok(exe.args.some(a => a.includes('--local-workspace=')));
  });

});
