'use strict';

import * as vscode from "vscode";
import { IFeature } from "../feature";
import { ILogger } from "../logging";

export class DebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  private logger: ILogger;
  private context: vscode.ExtensionContext;

  constructor(logger: ILogger, context: vscode.ExtensionContext) {
    this.logger = logger;
    this.context = context;
  }

  public provideDebugConfigurations(folder: vscode.WorkspaceFolder | undefined, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration[]> {
    return undefined;
  }

  public resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
    return debugConfiguration;
  }
}

export class DebugConfigurationFeature implements IFeature {
  constructor(logger: ILogger, context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('Puppet', new DebugConfigurationProvider(logger, context)));
    logger.debug("Registered DebugConfigurationProvider")
  }

  public dispose(): any { return undefined; }
}
