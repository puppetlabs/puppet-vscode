'use strict';

import vscode = require("vscode");
import { ProtocolType, PuppetInstallType } from './interfaces';

export interface IEditorServiceDockerSettings {
  // Future Use
}

export interface IEditorServiceTCPSettings {
  address?: string;
  port?: number;
}

export interface IEditorServiceSettings {
  debugFilePath?: string;
  docker?: IEditorServiceDockerSettings;
  enable?: boolean;
  featureflags?: string[];
  loglevel?: string;
  protocol?: string;
  tcp?: IEditorServiceTCPSettings;
  timeout?: number;
}

export interface IFormatSettings {
  enable?: boolean;
}

export interface ILintSettings {
  // Future Use
  enable?: boolean; // Future Use: Puppet Editor Services doesn't implement this yet.
}

export interface IPDKSettings {
  // Future Use
}

export interface ISettings {
  editorService?: IEditorServiceSettings;
  format?: IFormatSettings;
  installDirectory?: string;
  installType?: PuppetInstallType;
  lint?: ILintSettings;
  pdk?: IPDKSettings;
}

const workspaceSectionName = "puppet";

/**
 * Safely query the workspace configuration for a nested setting option.  If it, or any part of the setting
 * path does not exist, return undefined
 * @param workspaceConfig The VScode workspace configuration to query
 * @param indexes         An array of strings defining the setting path, e.g. The setting 'a.b.c' would pass indexes of ['a','b','c']
 */
function getSafeWorkspaceConfig(workspaceConfig: vscode.WorkspaceConfiguration, indexes:string[] ): any {
  if (indexes.length <= 0) { return undefined; }

  let index: string = indexes.shift();
  let result: Object = workspaceConfig[index];
  while ((indexes.length > 0) && (result !== undefined) ) {
    index = indexes.shift();
    result = result[index];
  }

  // A null settings is really undefined.
  if (result === null) { return undefined; }

  return result;
}

/**
 * Retrieves the list of "legacy" or deprecated setting names and their values
 */
export function legacySettings(): Map<string, Object> {
  const workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(workspaceSectionName);

  let settings: Map<string, Object> = new Map<string, Object>();
  let value: Object = undefined;

  // puppet.languageclient.minimumUserLogLevel
  value = getSafeWorkspaceConfig(workspaceConfig, ['languageclient','minimumUserLogLevel']);
  if (value !== undefined) { settings.set("puppet.languageclient.minimumUserLogLevel", value); }

  // puppet.languageclient.protocol
  value = getSafeWorkspaceConfig(workspaceConfig, ['languageclient','protocol']);
  if (value !== undefined) { settings.set("puppet.languageclient.protocol", value); }

  // puppet.languageserver.address
  value = getSafeWorkspaceConfig(workspaceConfig, ['languageserver','address']);
  if (value !== undefined) { settings.set("puppet.languageserver.address", value); }

  // puppet.languageserver.debugFilePath
  value = getSafeWorkspaceConfig(workspaceConfig, ['languageserver','debugFilePath']);
  if (value !== undefined) { settings.set("puppet.languageserver.debugFilePath", value); }

  // puppet.languageserver.filecache.enable
  value = getSafeWorkspaceConfig(workspaceConfig, ['languageserver','filecache','enable']);
  if (value !== undefined) { settings.set("puppet.languageserver.filecache.enable", value); }

  // puppet.languageserver.port
  value = getSafeWorkspaceConfig(workspaceConfig, ['languageserver','port']);
  if (value !== undefined) { settings.set("puppet.languageserver.port", value); }

  // puppet.languageserver.timeout
  value = getSafeWorkspaceConfig(workspaceConfig, ['languageserver','timeout']);
  if (value !== undefined) { settings.set("puppet.languageserver.timeout", value); }

  // puppet.puppetAgentDir
  value = getSafeWorkspaceConfig(workspaceConfig, ['puppetAgentDir']);
  if (value !== undefined) { settings.set("puppet.puppetAgentDir", value); }

  return settings;
}

export function settingsFromWorkspace(): ISettings {
  // Default settings
  const defaultEditorServiceSettings: IEditorServiceSettings = {
    enable: true,
    featureflags: [],
    loglevel: "normal",
    protocol: ProtocolType.STDIO,
    timeout: 10,
  };

  const defaultFormatSettings: IFormatSettings = {
    enable: true,
  };

  const defaultLintSettings: ILintSettings = {
    enable: true,
  };

  const defaultPDKSettings: IPDKSettings = {};

  const workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(workspaceSectionName);

  // TODO: What if the wrong type is passed through? will it blow up?
  let settings = {
    editorService: workspaceConfig.get<IEditorServiceSettings>("editorService", defaultEditorServiceSettings),
    format: workspaceConfig.get<IFormatSettings>("format", defaultFormatSettings),
    installDirectory: workspaceConfig.get<string>("installDirectory", undefined),
    installType: workspaceConfig.get<PuppetInstallType>("installType", PuppetInstallType.PUPPET),
    lint: workspaceConfig.get<ILintSettings>("lint", defaultLintSettings),
    pdk: workspaceConfig.get<IPDKSettings>("pdk", defaultPDKSettings)
  };

  /**
   * Legacy Workspace Settings
   * 
   * Retrieve deprecated settings and apply them to the settings.  This is only needed as a helper and should be 
   * removed a version or two later, after the setting is deprecated.
   */

   // Ensure that object types needed for legacy settings exists
  if (settings.editorService === undefined) { settings.editorService = {}; }
  if (settings.editorService.featureflags === undefined) { settings.editorService.featureflags = []; }
  if (settings.editorService.tcp === undefined) { settings.editorService.tcp = {}; }

  // Retrieve the legacy settings
  const oldSettings: Map<string, Object> = legacySettings();

  // Translate the legacy settings into the new setting names
  for (const [settingName, value] of oldSettings) {
    switch (settingName) {

      case "puppet.languageclient.minimumUserLogLevel": // --> puppet.editorService.loglevel
        settings.editorService.loglevel = <string>value;
        break;

      case "puppet.languageclient.protocol": // --> puppet.editorService.protocol
        settings.editorService.protocol = <ProtocolType>value;
        break;

      case "puppet.languageserver.address": // --> puppet.editorService.tcp.address
        settings.editorService.tcp.address = <string>value;
        break;

      case "puppet.languageserver.debugFilePath": // --> puppet.editorService.debugFilePath
        settings.editorService.debugFilePath = <string>value;
        break;

      case "puppet.languageserver.filecache.enable": // --> puppet.editorService.featureflags['filecache']
        if (value === true) { settings.editorService.featureflags.push("filecache"); }
        break;

      case "puppet.languageserver.port": // --> puppet.editorService.tcp.port
        settings.editorService.tcp.port = <number>value;
        break;

      case "puppet.languageserver.timeout": // --> puppet.editorService.timeout
        settings.editorService.timeout = <number>value;
        break;

      case "puppet.puppetAgentDir": // --> puppet.installDirectory
        settings.installDirectory = <string>value;
        break;
      }
  }

  return settings;
}
