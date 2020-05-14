'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';

import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { CommandEnvironmentHelper } from '../helpers/commandHelper';
import { IAggregateConfiguration } from '../configuration';

// Socket vs Exec DebugAdapter types
// https://github.com/Microsoft/vscode/blob/2808feeaf6b24feaaa6ba49fb91ea165c4d5fb06/src/vs/workbench/parts/debug/node/debugger.ts#L58-L61
//
// DebugAdapterExecutable uses stdin/stdout
// https://github.com/Microsoft/vscode/blob/2808feeaf6b24feaaa6ba49fb91ea165c4d5fb06/src/vs/workbench/parts/debug/node/debugAdapter.ts#L305
//
// DebugAdapterServer uses tcp
// https://github.com/Microsoft/vscode/blob/2808feeaf6b24feaaa6ba49fb91ea165c4d5fb06/src/vs/workbench/parts/debug/node/debugAdapter.ts#L256

export class DebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory, vscode.Disposable {
  readonly Context: vscode.ExtensionContext;
  readonly Config: IAggregateConfiguration;
  readonly Logger: ILogger;

  public ChildProcesses: cp.ChildProcess[] = [];

  constructor(context: vscode.ExtensionContext, config: IAggregateConfiguration, logger: ILogger) {
    this.Context = context;
    this.Config = config;
    this.Logger = logger;
  }

  public createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable,
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    // Right now we don't care about session as we only have one type of adapter, which is launch.  When
    // we add the ability to attach to a debugger remotely we'll need to switch scenarios based on `session`
    let thisFactory = this;

    return new Promise<vscode.DebugAdapterDescriptor>(function (resolve, reject) {
      let debugServer = CommandEnvironmentHelper.getDebugServerRubyEnvFromConfiguration(
        thisFactory.Context.asAbsolutePath(thisFactory.Config.ruby.debugServerPath),
        thisFactory.Config,
      );

      let spawn_options: cp.SpawnOptions = {};
      spawn_options.env = debugServer.options.env;
      spawn_options.stdio = 'pipe';
      if (process.platform !== 'win32') {
        spawn_options.shell = true;
      }

      thisFactory.Logger.verbose(
        'Starting the Debug Server with ' + debugServer.command + ' ' + debugServer.args.join(' '),
      );
      let debugServerProc = cp.spawn(debugServer.command, debugServer.args, spawn_options);
      thisFactory.ChildProcesses.push(debugServerProc);

      let debugSessionRunning: boolean = false;
      debugServerProc.stdout.on('data', (data) => {
        thisFactory.Logger.debug('Debug Server STDOUT: ' + data.toString());
        // If the debug client isn't already running and it's sent the trigger text, start up a client
        if (!debugSessionRunning && data.toString().match('DEBUG SERVER RUNNING') !== null) {
          debugSessionRunning = true;

          var p = data.toString().match(/DEBUG SERVER RUNNING (.*):(\d+)/);
          if (p === null) {
            reject('Debug Server started but unable to parse hostname and port');
          } else {
            thisFactory.Logger.debug('Starting Debug Client connection to ' + p[1] + ':' + p[2]);
            resolve(new vscode.DebugAdapterServer(Number(p[2]), p[1]));
          }
        }
      });
      debugServerProc.on('error', (data) => {
        thisFactory.Logger.error('Debug Srver errored with ' + data);
        reject('Spawning Debug Server failed with ' + data);
      });
      debugServerProc.on('close', (exitCode) => {
        thisFactory.Logger.verbose('Debug Server exited with exitcode ' + exitCode);
      });
    });
  }

  public dispose(): any {
    this.ChildProcesses.forEach((item) => {
      item.kill('SIGHUP');
    });
    this.ChildProcesses = [];
    return undefined;
  }
}

export class DebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  private debugType: string;
  private logger: ILogger;
  private context: vscode.ExtensionContext;

  constructor(debugType: string, logger: ILogger, context: vscode.ExtensionContext) {
    this.debugType = debugType;
    this.logger = logger;
    this.context = context;
  }

  public provideDebugConfigurations(
    folder: vscode.WorkspaceFolder | undefined,
    token?: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
    return [this.createLaunchConfigFromContext(folder)];
  }

  public resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    debugConfiguration: vscode.DebugConfiguration,
    token?: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.DebugConfiguration> {
    return debugConfiguration;
  }

  private createLaunchConfigFromContext(folder: vscode.WorkspaceFolder | undefined): vscode.DebugConfiguration {
    let config = {
      type: this.debugType,
      request: 'launch',
      name: 'Puppet Apply current file',
      manifest: '${file}',
      args: [],
      noop: true,
      cwd: '${file}',
    };

    return config;
  }
}

export class DebuggingFeature implements IFeature {
  private factory: DebugAdapterDescriptorFactory;
  private provider: DebugConfigurationProvider;

  constructor(debugType: string, config: IAggregateConfiguration, context: vscode.ExtensionContext, logger: ILogger) {
    this.factory = new DebugAdapterDescriptorFactory(context, config, logger);
    this.provider = new DebugConfigurationProvider(debugType, logger, context);

    logger.debug('Registered DebugAdapterDescriptorFactory for ' + debugType);
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory(debugType, this.factory));

    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(debugType, this.provider));
    logger.debug('Registered DebugConfigurationProvider for ' + debugType);
  }

  public dispose(): any {
    if (this.factory !== null) {
      this.factory.dispose();
      this.factory = null;
    }
  }
}
