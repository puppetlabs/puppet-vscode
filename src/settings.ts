'use strict';

import vscode = require('vscode');
import * as os from 'os';
import * as path from 'path';

export enum PuppetInstallType {
  PDK = 'pdk',
  PUPPET = 'agent',
  AUTO = 'auto',
}

export enum ProtocolType {
  UNKNOWN = '<unknown>',
  STDIO = 'stdio',
  TCP = 'tcp',
}

export enum ConnectionType {
  Unknown,
  Local,
  Remote,
}

export interface IEditorServiceTCPSettings {
  address?: string;
  port?: number;
}

export interface IEditorServicePuppetSettings {
  confdir?: string;
  environment?: string;
  modulePath?: string;
  vardir?: string;
  version?: string;
}

export interface IEditorServiceSettings {
  debugFilePath?: string;
  enable?: boolean;
  featureFlags?: string[];
  loglevel?: string;
  protocol?: ProtocolType;
  puppet?: IEditorServicePuppetSettings;
  tcp?: IEditorServiceTCPSettings;
  timeout?: number;
}

export interface IFormatSettings {
  enable?: boolean;
}
export interface IHoverSettings {
  showMetadataInfo?: boolean;
  // showPuppetfileInfo?: boolean; Future use
}

export interface ILintSettings {
  // Future Use
  enable?: boolean; // Future Use: Puppet Editor Services doesn't implement this yet.
}

export interface IPDKSettings {
  checkVersion?: boolean;
}

export interface IPCTSettings {
  enable?: boolean;
  installDirectory?: string;
  enableTelemetry?: boolean;
}

export interface IPRMSettings {
  enable?: boolean;
  installDirectory?: string;
  enableTelemetry?: boolean;
}

export interface INotificationSettings {
  nodeGraph?: string;
  puppetResource?: string;
}

export interface ISettings {
  editorService?: IEditorServiceSettings;
  format?: IFormatSettings;
  hover?: IHoverSettings;
  installDirectory?: string;
  installType?: PuppetInstallType;
  lint?: ILintSettings;
  notification?: INotificationSettings;
  pdk?: IPDKSettings;
  pct?: IPCTSettings;
  prm?: IPRMSettings;
}

const workspaceSectionName = 'puppet';

/**
 * Safely query the workspace configuration for a nested setting option.  If it, or any part of the setting
 * path does not exist, return undefined
 * @param workspaceConfig The VScode workspace configuration to query
 * @param indexes         An array of strings defining the setting path, e.g. The setting 'a.b.c' would pass indexes of ['a','b','c']
 */
function getSafeWorkspaceConfig(workspaceConfig: vscode.WorkspaceConfiguration, indexes: string[]): any {
  if (indexes.length <= 0) {
    return undefined;
  }

  let index: string = indexes.shift();
  let result: Record<string, any> = workspaceConfig[index];
  while (indexes.length > 0 && result !== undefined) {
    index = indexes.shift();
    result = result[index];
  }

  // A null settings is really undefined.
  if (result === null) {
    return undefined;
  }

  return result;
}

/**
 * Retrieves the list of "legacy" or deprecated setting names and their values
 */
export function legacySettings(): Map<string, Record<string, any>> {
  const workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(workspaceSectionName);

  const settings: Map<string, Record<string, any>> = new Map<string, Record<string, any>>();
  const value: Record<string, any> = undefined;

  // puppet.editorService.modulePath
  // value = getSafeWorkspaceConfig(workspaceConfig, ['editorService', 'modulePath']);
  // if (value !== undefined) {
  //   settings.set('puppet.editorService.modulePath', value);
  // }

  return settings;
}

// Default settings
export function DefaultWorkspaceSettings(): ISettings {
  return {
    editorService: {
      enable: true,
      featureFlags: [],
      loglevel: 'normal',
      protocol: ProtocolType.STDIO,
      timeout: 10,
    },
    format: {
      enable: true,
    },
    hover: {
      showMetadataInfo: true,
    },
    installDirectory: undefined,
    installType: PuppetInstallType.AUTO,
    lint: {
      enable: true,
    },
    notification: {
      nodeGraph: 'messagebox',
      puppetResource: 'messagebox',
    },
    pdk: {
      checkVersion: true,
    },
    pct: {
      enable: true,
      installDirectory: path.join(os.homedir(), '.puppetlabs', 'pct'),
      enableTelemetry: true,
    },
    prm: {
      enable: true,
      installDirectory: path.join(os.homedir(), '.puppetlabs', 'prm'),
      enableTelemetry: true,
    },
  };
}

export function SettingsFromWorkspace(): ISettings {
  const workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(workspaceSectionName);
  const defaults: ISettings = DefaultWorkspaceSettings();

  // TODO: What if the wrong type is passed through? will it blow up?
  const settings = {
    editorService: workspaceConfig.get<IEditorServiceSettings>('editorService', defaults.editorService),
    format: workspaceConfig.get<IFormatSettings>('format', defaults.format),
    hover: workspaceConfig.get<IHoverSettings>('hover', defaults.hover),
    installDirectory: workspaceConfig.get<string>('installDirectory', defaults.installDirectory),
    installType: workspaceConfig.get<PuppetInstallType>('installType', defaults.installType),
    lint: workspaceConfig.get<ILintSettings>('lint', defaults.lint),
    notification: workspaceConfig.get<INotificationSettings>('notification', defaults.notification),
    pdk: workspaceConfig.get<IPDKSettings>('pdk', defaults.pdk),
    pct: workspaceConfig.get<IPCTSettings>('pct', defaults.pct),
  };

  if (settings.installDirectory && settings.installType === PuppetInstallType.AUTO) {
    const message =
      "Do not use 'installDirectory' and set 'installType' to auto. The 'installDirectory' setting" +
      ' is meant for custom installation directories that will not be discovered by the extension';
    const title = 'Configuration Information';
    const helpLink = 'https://puppet-vscode.github.io/docs/extension-settings';
    vscode.window.showErrorMessage(message, { modal: false }, { title: title }).then((item) => {
      if (item === undefined) {
        return;
      }
      if (item.title === title) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(helpLink));
      }
    });
  }

  // This is here because the section doesn't seem to be properly populated above.
  // I must be missing something obvious.
  if (!settings.pct.installDirectory) {
    settings.pct.installDirectory = defaults.pct.installDirectory;
  }

  /**
   * Legacy Workspace Settings
   *
   * Retrieve deprecated settings and apply them to the settings.  This is only needed as a helper and should be
   * removed a version or two later, after the setting is deprecated.
   */

  // Ensure that object types needed for legacy settings exists
  if (settings.editorService === undefined) {
    settings.editorService = {};
  }
  if (settings.editorService.featureFlags === undefined) {
    settings.editorService.featureFlags = [];
  }
  if (settings.editorService.puppet === undefined) {
    settings.editorService.puppet = {};
  }
  if (settings.editorService.tcp === undefined) {
    settings.editorService.tcp = {};
  }

  // Retrieve the legacy settings
  const oldSettings: Map<string, Record<string, any>> = legacySettings();

  // Translate the legacy settings into the new setting names
  for (const [settingName, value] of oldSettings) {
    // eslint-disable-next-line no-empty
    switch (
      settingName
      // case 'puppet.puppetAgentDir': // --> puppet.installDirectory
      //   settings.installDirectory = <string>value;
      //   break;
    ) {
    }
  }

  return settings;
}
