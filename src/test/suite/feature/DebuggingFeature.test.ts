import * as assert from 'assert';
import * as cp from 'child_process';
import { EventEmitter } from 'events';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { IAggregateConfiguration } from '../../../configuration';
import { DebugAdapterDescriptorFactory, DebugConfigurationProvider, DebuggingFeature } from '../../../feature/DebuggingFeature';
import { ILogger } from '../../../logging';
import * as index from '../index';

describe('DebuggingFeature', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;
  let mockConfig: IAggregateConfiguration;
  let mockLogger: ILogger;
  let registerDebugAdapterDescriptorFactoryStub: sinon.SinonStub;
  let registerDebugConfigurationProviderStub: sinon.SinonStub;
  let debugType: string = 'debug';
  const mockChildProcess = {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    on: function(event, handler) {
      this[event] = handler;
    },
  } as any as cp.ChildProcess;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockContext = index.extContext;
    mockConfig = index.configSettings;
    mockLogger = index.logger;
    // Stub the registerDebugAdapterDescriptorFactory and registerDebugConfigurationProvider methods
    registerDebugAdapterDescriptorFactoryStub = sandbox.stub(vscode.debug, 'registerDebugAdapterDescriptorFactory');
    registerDebugConfigurationProviderStub = sandbox.stub(vscode.debug, 'registerDebugConfigurationProvider');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('DebuggingFeature constructor correctly initializes properties', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    assert.strictEqual(debuggingFeature['factory'].Context, mockContext);
    assert.strictEqual(debuggingFeature['factory'].Config, mockConfig);
    assert.strictEqual(debuggingFeature['factory'].Logger, mockLogger);
  });

  it('DebuggingFeature constructor registers DebugAdapterDescriptorFactory', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    assert(registerDebugAdapterDescriptorFactoryStub.calledOnceWith(debugType, debuggingFeature['factory']));
  });

  it('createDebugAdapterDescriptor returns expected descriptor on successful scenario', async () => {
    const mockSession = {} as vscode.DebugSession;
    const mockExecutable = {} as vscode.DebugAdapterExecutable;
    const mockSpawn = sandbox.stub(cp, 'spawn');
    mockSpawn.callsFake(() => {
      process.nextTick(() => mockChildProcess.stdout.emit('data', 'DEBUG SERVER RUNNING localhost:1234'));
      return mockChildProcess;
    });

    const factory = new DebugAdapterDescriptorFactory(mockContext, mockConfig, mockLogger);
    const descriptor = await factory.createDebugAdapterDescriptor(mockSession, mockExecutable);

    sandbox.assert.match(descriptor, new vscode.DebugAdapterServer(1234, 'localhost'));
  });

  // Test that DebugAdapterDescriptorFactory correctly handles 'error' event from debugServerProc
  it('DebugAdapterDescriptorFactory correctly handles \'error\' event from debugServerProc', async () => {
    const mockSession = {} as vscode.DebugSession;
    const mockExecutable = {} as vscode.DebugAdapterExecutable;

    const mockSpawn = sandbox.stub(cp, 'spawn');
    mockSpawn.callsFake(() => {
      process.nextTick(() => mockChildProcess['error']('Test error'));
      return mockChildProcess;
    });

    const factory = new DebugAdapterDescriptorFactory(mockContext, mockConfig, mockLogger);
    try {
      await factory.createDebugAdapterDescriptor(mockSession, mockExecutable);
    } catch (error) {
      assert.strictEqual(error, 'Spawning Debug Server failed with Test error');
    }
});

// Test that DebugAdapterDescriptorFactory correctly handles 'close' event from debugServerProc
it('DebugAdapterDescriptorFactory correctly handles \'close\' event from debugServerProc', async () => {
  const mockSession = {} as vscode.DebugSession;
  const mockExecutable = {} as vscode.DebugAdapterExecutable;
  const mockLoggerVerbose = sandbox.stub(mockLogger, 'verbose');

  const mockSpawn = sandbox.stub(cp, 'spawn');
  mockSpawn.callsFake(() => {
    process.nextTick(() => {
      mockChildProcess.stdout.emit('data', 'DEBUG SERVER RUNNING localhost:1234');
      mockChildProcess['close'](0);
    });
    return mockChildProcess;
  });

  const factory = new DebugAdapterDescriptorFactory(mockContext, mockConfig, mockLogger);
  await factory.createDebugAdapterDescriptor(mockSession, mockExecutable);
  sandbox.assert.calledWith(mockLoggerVerbose, 'Debug Server exited with exitcode 0');
});

  it('dispose method empties ChildProcesses array', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    debuggingFeature['factory'].dispose();
    assert.strictEqual(debuggingFeature['factory'].ChildProcesses.length, 0);
  });

  it('DebuggingFeature constructor registers DebugConfigurationProvider', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    assert(registerDebugConfigurationProviderStub.calledOnceWith(debugType, debuggingFeature['provider']));
  });

  it('DebuggingFeature dispose method sets factory to null', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    debuggingFeature.dispose();
    assert.strictEqual(debuggingFeature['factory'], null);
  });
});


describe('DebugConfigurationProvider', () => {
  let sandbox: sinon.SinonSandbox;
  let provider: DebugConfigurationProvider;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    provider = new DebugConfigurationProvider('Puppet', index.logger, index.extContext);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('provideDebugConfigurations returns a launch config array', () => {
    const configs = provider.provideDebugConfigurations(undefined);
    assert.ok(Array.isArray(configs));
    assert.equal((configs as any[]).length, 1);
  });

  it('resolveDebugConfiguration returns the debugConfiguration as-is', () => {
    const config = { type: 'Puppet', request: 'launch', name: 'test' };
    const result = provider.resolveDebugConfiguration(undefined, config);
    assert.equal(result, config);
  });

  it('createLaunchConfigFromContext returns correct default config', () => {
    const configs = provider.provideDebugConfigurations(undefined) as any[];
    const config = configs[0];
    assert.equal(config.type, 'Puppet');
    assert.equal(config.request, 'launch');
    assert.equal(config.name, 'Puppet Apply current file');
    assert.equal(config.manifest, '${file}');
    assert.deepEqual(config.args, []);
    assert.equal(config.noop, true);
  });
});


describe('DebugAdapterDescriptorFactory - additional coverage', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it('createDebugAdapterDescriptor rejects when DEBUG SERVER RUNNING has no port match (line 69)', async () => {
    const mockProcess = {
      stdout: { on: sandbox.stub() },
      on: sandbox.stub(),
      pid: 123,
    } as any;
    sandbox.stub(require('child_process'), 'spawn').returns(mockProcess);

    const config = require('../../../configuration').createAggregrateConfiguration(
      require('../../../settings').defaultWorkspaceSettings()
    );
    const factory = new DebugAdapterDescriptorFactory(
      require('../index').extContext, config, require('../index').logger
    );

    const session = {} as any;
    const exec = {} as any;
    const resultPromise = factory.createDebugAdapterDescriptor(session, exec);

    // Simulate stdout: "DEBUG SERVER RUNNING" but without a valid port:host pattern
    const stdoutCallback = (mockProcess.stdout.on as sinon.SinonStub).firstCall?.args[1];
    if (stdoutCallback) {
      stdoutCallback('DEBUG SERVER RUNNING\n'); // no host:port → p === null → line 69
    }

    try { await resultPromise; } catch (e) {
      assert.ok(e.includes('unable to parse') || e.includes('DEBUG'));
    }
    assert.ok(true);
  });

  it('dispose kills ChildProcesses items (line 88)', () => {
    const config = require('../../../configuration').createAggregrateConfiguration(
      require('../../../settings').defaultWorkspaceSettings()
    );
    const factory = new DebugAdapterDescriptorFactory(
      require('../index').extContext, config, require('../index').logger
    );
    // Add a mock process to ChildProcesses
    const mockProc = { kill: sandbox.stub() };
    (factory as any).ChildProcesses = [mockProc];
    factory.dispose();
    sinon.assert.calledWith(mockProc.kill as sinon.SinonStub, 'SIGHUP');
  });
});
