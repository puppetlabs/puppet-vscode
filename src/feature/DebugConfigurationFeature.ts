'use strict';

import * as vscode from "vscode";
import * as path from 'path';

import { IFeature } from "../feature";
import { ILogger } from "../logging";

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
  }

  public dispose(): any { return undefined; }
}
