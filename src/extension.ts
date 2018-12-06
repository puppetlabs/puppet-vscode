'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { ConnectionConfiguration } from './configuration';
import { ConnectionHandler } from './handler';
import { StdioConnectionHandler } from './handlers/stdio';
import { TcpConnectionHandler } from './handlers/tcp';
import { IFeature } from './feature';
import { DebugConfigurationFeature } from './feature/DebugConfigurationFeature';
import { FormatDocumentFeature } from './feature/FormatDocumentFeature';
import { NodeGraphFeature } from './feature/NodeGraphFeature';
import { PDKFeature } from './feature/PDKFeature';
import { PuppetResourceFeature } from './feature/PuppetResourceFeature';
import { ProtocolType, ConnectionType, IConnectionConfiguration } from './interfaces';
import { ILogger } from './logging';
import { OutputChannelLogger } from './logging/outputchannel';
import { PuppetCommandStrings } from './messages';
import { PuppetStatusBar } from './PuppetStatusBar';
import { ISettings, legacySettings, settingsFromWorkspace } from './settings';
import { Reporter } from './telemetry/telemetry';

const langID = 'puppet'; // don't change this
let extContext: vscode.ExtensionContext;
let connectionHandler: ConnectionHandler;
let settings: ISettings;
let logger: OutputChannelLogger;
let statusBar: PuppetStatusBar;
let configSettings: IConnectionConfiguration;
let extensionFeatures: IFeature[] = [];

export function activate(context: vscode.ExtensionContext) {
  extContext = context;

  notifyOnNewExtensionVersion(extContext);
  checkForLegacySettings();

  context.subscriptions.push(new Reporter(extContext));

  settings       = settingsFromWorkspace();
  logger         = new OutputChannelLogger(settings);
  statusBar      = new PuppetStatusBar(langID, context, logger);
  configSettings = new ConnectionConfiguration();

  if(checkInstallDirectory(configSettings, logger) === false){
    // If this returns false, then we needed a local directory
    // but did not find it, so we should abort here
    // If we return true, we can continue
    // This can be revisited to enable disabling language server portion
    return;
  }

  switch (configSettings.protocol) {
    case ProtocolType.STDIO:
      connectionHandler = new StdioConnectionHandler(extContext, settings, statusBar, logger, configSettings);
      break;
    case ProtocolType.TCP:
      connectionHandler = new TcpConnectionHandler(extContext, settings, statusBar, logger, configSettings);
      break;
  }

  extensionFeatures = [
    new DebugConfigurationFeature(logger, extContext),
    new FormatDocumentFeature(langID, connectionHandler, settings, logger, extContext),
    new NodeGraphFeature(langID, connectionHandler, logger, extContext),
    new PDKFeature(extContext, logger),
    new PuppetResourceFeature(extContext, connectionHandler, logger)
  ];
}

export function deactivate() {
  // Dispose all extension features
  extensionFeatures.forEach(feature => {
    feature.dispose();
  });

  if (connectionHandler !== undefined) {
    connectionHandler.stop();
  }
}

function checkForLegacySettings() {
  // Raise a warning if we detect any legacy settings
  const legacySettingValues: Map<string, Object> = legacySettings();
  if (legacySettingValues.size > 0) {
    let settingNames: string[] = [];
    for (const [settingName, _value] of legacySettingValues) {
      settingNames.push(settingName);
    }
    vscode.window.showWarningMessage(
      'Deprecated Puppet settings have been detected. Please either remove them or, convert them to the correct settings names. (' +
        settingNames.join(', ') +
        ')',
      { modal: false }
    );
  }
}

function checkInstallDirectory(configSettings: IConnectionConfiguration, logger: ILogger) : boolean {
  if(configSettings.protocol === ProtocolType.TCP){
    if(configSettings.type === ConnectionType.Remote){
      // Return if we are connecting to a remote TCP LangServer
      return true;
    }
  }

  // we want to check directory if STDIO or Local TCP
  if (!fs.existsSync(configSettings.puppetBaseDir)) {
    showErrorMessage(
      `Could not find a valid Puppet installation at '${
        configSettings.puppetBaseDir
      }'. While syntax highlighting and grammar detection will still work, intellisense and other advanced features will not.`,
      'Troubleshooting Information',
      'https://github.com/lingua-pupuli/puppet-vscode#experience-a-problem',
      logger
    );
    return false;
  } else {
    logger.debug('Found a valid Puppet installation at ' + configSettings.puppetDir);
    return true;
  }
}

function showErrorMessage(message: string, title: string, helpLink: string, logger: ILogger) {
  logger.error(message);
  vscode.window.showErrorMessage(message, { modal: false }, { title: title }).then(item => {
    if (item === undefined) {
      return;
    }
    if (item.title === title) {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(helpLink));
    }
  });
}

async function notifyOnNewExtensionVersion(context: vscode.ExtensionContext) {
  const puppetExtension = vscode.extensions.getExtension('jpogran.puppet-vscode')!;
  const version = puppetExtension.packageJSON.version;

  const viewReleaseNotes = 'View Release Notes';
  const suppressUpdateNotice = 'SuppressUpdateNotice';
  const dontShowAgainNotice = "Don't show again";

  if (context.globalState.get(suppressUpdateNotice, false)) {
    return;
  }

  const result = await vscode.window.showInformationMessage(
    `Puppet VSCode has been updated to v${version}`,
    { modal: false },
    { title: dontShowAgainNotice },
    { title: viewReleaseNotes }
  );

  if (result === undefined) {
    return;
  }

  if (result.title === viewReleaseNotes) {
    vscode.commands.executeCommand(
      'vscode.open',
      vscode.Uri.parse('https://marketplace.visualstudio.com/items/jpogran.puppet-vscode/changelog')
    );
  } else {
    context.globalState.update(suppressUpdateNotice, true);
  }
}
