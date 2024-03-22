import * as assert from 'assert';
import * as cp from 'child_process';
import { EventEmitter } from 'events';
import { afterEach } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { IAggregateConfiguration } from '../../../configuration';
import { DebugAdapterDescriptorFactory, DebuggingFeature } from '../../../feature/DebuggingFeature';
import { ILogger } from '../../../logging';
import * as index from '../index';

suite('DebuggingFeature Test Suite', () => {
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

  setup(() => {
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

  test('DebuggingFeature constructor correctly initializes properties', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    assert.strictEqual(debuggingFeature['factory'].Context, mockContext);
    assert.strictEqual(debuggingFeature['factory'].Config, mockConfig);
    assert.strictEqual(debuggingFeature['factory'].Logger, mockLogger);
  });

  test('DebuggingFeature constructor registers DebugAdapterDescriptorFactory', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    assert(registerDebugAdapterDescriptorFactoryStub.calledOnceWith(debugType, debuggingFeature['factory']));
  });

  test('createDebugAdapterDescriptor returns expected descriptor on successful scenario', async () => {
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
test('DebugAdapterDescriptorFactory correctly handles \'error\' event from debugServerProc', async () => {
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
test('DebugAdapterDescriptorFactory correctly handles \'close\' event from debugServerProc', async () => {
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

  test('dispose method empties ChildProcesses array', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    debuggingFeature['factory'].dispose();
    assert.strictEqual(debuggingFeature['factory'].ChildProcesses.length, 0);
  });

  test('DebuggingFeature constructor registers DebugConfigurationProvider', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    assert(registerDebugConfigurationProviderStub.calledOnceWith(debugType, debuggingFeature['provider']));
  });

  test('DebuggingFeature dispose method sets factory to null', () => {
    const debuggingFeature = new DebuggingFeature(debugType, mockConfig, mockContext, mockLogger);
    debuggingFeature.dispose();
    assert.strictEqual(debuggingFeature['factory'], null);
  });
});
