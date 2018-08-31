'use strict';

import * as vscode from "vscode";
import * as path from 'path';

import { IFeature } from "../feature";
import { ILogger } from "../logging";
import { IConnectionConfiguration } from '../interfaces';
import { ConnectionConfiguration } from "../configuration";
import { RubyHelper } from "../rubyHelper";

const PuppetAdapterExecutableCommandId = 'extension.puppetAdapterExecutableCommand';

export class DebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  private debugType: string;
  private logger: ILogger;
  private context: vscode.ExtensionContext;

  constructor(debugType:string, logger: ILogger, context: vscode.ExtensionContext) {
    this.debugType = debugType;
    this.logger = logger;
    this.context = context;
  }

  public provideDebugConfigurations(
    folder: vscode.WorkspaceFolder | undefined,
    token?: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
    return [ this.createLaunchConfigFromContext(folder) ];
  }

  public resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    debugConfiguration: vscode.DebugConfiguration,
    token?: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DebugConfiguration> {
    return debugConfiguration;
  }

  public puppetAdapterExecutableCommand(context: vscode.ExtensionContext) {
    const config: IConnectionConfiguration = new ConnectionConfiguration();
    const rubyConfig = RubyHelper.getRubyEnvFromConfiguration('', config, this.logger);

    const debugAdapterPath = path.join(this.context.extensionPath, 'out', 'debugAdapter.js');
    const debugServerPath = path.join(__dirname,'..','..','vendor', 'languageserver', 'puppet-debugserver');
    let args = [];

    args.push(debugAdapterPath);
    // Add path the ruby executable
    args.push(`\"RUBY=${rubyConfig.command}\"`);
    // Add path to the Debug Server file
    args.push(`\"RUBYFILE=${debugServerPath}\"`);
    // // Add additional environment variables
    const currentEnv = process.env;
    for (const key in rubyConfig.options.env) {
      const value = rubyConfig.options.env[key];
      if (!currentEnv[key] || (currentEnv[key] !== value)) {
        args.push(`\"ENV=${key}=${value}\"`);
      }
    }
    // TODO: Add additional command line args e.g. --debuglogfie

    return {
      command: 'node',
      args: args
    };
  }

  private createLaunchConfigFromContext(folder: vscode.WorkspaceFolder | undefined): vscode.DebugConfiguration {
    let config = {
      type: this.debugType,
      request: 'launch',
      name: 'Puppet Apply current file',
      manifest: "${file}",
      args: [],
      noop: true,
      cwd: "${file}",
    };

    return config;
  }
}

export class DebugConfigurationFeature implements IFeature {
  private debugType: string = 'Puppet';
  private provider: DebugConfigurationProvider;

  constructor(logger: ILogger, context: vscode.ExtensionContext) {
    this.provider = new DebugConfigurationProvider(this.debugType, logger, context);
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(this.debugType, this.provider));
    logger.debug("Registered DebugConfigurationProvider");
    context.subscriptions.push(vscode.commands.registerCommand(PuppetAdapterExecutableCommandId, () => this.provider.puppetAdapterExecutableCommand(context)));
    logger.debug("Registered " + PuppetAdapterExecutableCommandId + " command");
  }

  public dispose(): any { return undefined; }
}
