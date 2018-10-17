'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { ConnectionManager } from './connection';
import { ConnectionConfiguration } from './configuration';
import { OutputChannelLogger } from './logging/outputchannel';
import { Reporter } from './telemetry/telemetry';
import { IFeature } from './feature';
import { PuppetStatusBar } from './PuppetStatusBar';
import { ISettings, legacySettings, settingsFromWorkspace } from './settings';
import { DebugConfigurationFeature } from './feature/DebugConfigurationFeature';
import { FormatDocumentFeature } from './feature/FormatDocumentFeature';
import { NodeGraphFeature } from './feature/NodeGraphFeature';
import { PDKFeature } from './feature/PDKFeature';
import { PuppetResourceFeature } from './feature/PuppetResourceFeature';
import { ILogger } from './logging';
import { ConnectionStatus } from './interfaces';

var connManager: ConnectionManager;
const langID = 'puppet'; // don't change this
let extensionFeatures: IFeature[] = [];

export function activate(context: vscode.ExtensionContext) {
  notifyOnNewExtensionVersion(context);
  checkForLegacySettings();

  context.subscriptions.push(new Reporter(context));
  const settings: ISettings = settingsFromWorkspace();
  var   logger              = new OutputChannelLogger(settings),
        statusBar           = new PuppetStatusBar(langID, context, logger),
        configSettings      = new ConnectionConfiguration();

  connManager = new ConnectionManager(context, logger, statusBar, configSettings);

  checkInstallDirectory(configSettings, logger);

  extensionFeatures = [
    new DebugConfigurationFeature(logger, context),
    new FormatDocumentFeature(langID, connManager, settings, logger, context),
    new NodeGraphFeature(langID, connManager, logger, context),
    new PDKFeature(context, logger),
    new PuppetResourceFeature(context, connManager, logger)
  ];

  connManager.start(configSettings);
}

export function status():ConnectionStatus{
  return connManager.status;
}

export function deactivate() {
  // Dispose all extension features
  extensionFeatures.forEach(feature => {
    feature.dispose();
  });

  if (connManager !== undefined) {
    connManager.stop();
    connManager.dispose();
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

function checkInstallDirectory(configSettings: ConnectionConfiguration, logger: ILogger) {
  if (!fs.existsSync(configSettings.puppetBaseDir)) {
    showErrorMessage(
      `Could not find a valid Puppet installation at '${
        configSettings.puppetBaseDir
      }'. While syntax highlighting and grammar detection will still work, intellisense and other advanced features will not.`,
      'Troubleshooting Information',
      'https://github.com/lingua-pupuli/puppet-vscode#experience-a-problem',
      logger
    );
    return null;
  } else {
    logger.debug('Found a valid Puppet installation at ' + configSettings.puppetDir);
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
