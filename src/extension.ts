'use strict';

import * as fs from 'fs';
import * as vscode from 'vscode';
import { ConnectionConfiguration } from './configuration';
import { IFeature } from './feature';
import { BoltFeature } from './feature/BoltFeature';
import { DebuggingFeature } from './feature/DebuggingFeature';
import { FormatDocumentFeature } from './feature/FormatDocumentFeature';
import { NodeGraphFeature } from './feature/NodeGraphFeature';
import { PDKFeature } from './feature/PDKFeature';
import { PuppetResourceFeature } from './feature/PuppetResourceFeature';
import { ConnectionHandler } from './handler';
import { DockerConnectionHandler } from './handlers/docker';
import { StdioConnectionHandler } from './handlers/stdio';
import { TcpConnectionHandler } from './handlers/tcp';
import { ConnectionType, IConnectionConfiguration, ProtocolType } from './interfaces';
import { ILogger } from './logging';
import { OutputChannelLogger } from './logging/outputchannel';
import { PuppetStatusBar } from './PuppetStatusBar';
import { ISettings, legacySettings, settingsFromWorkspace } from './settings';
import { Reporter, reporter } from './telemetry/telemetry';

export const puppetLangID = 'puppet'; // don't change this
export const puppetFileLangID = 'puppetfile'; // don't change this
const debugType = 'Puppet';  // don't change this

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
  reporter.sendTelemetryEvent('config', {
    'installType'   : settings.installType,
    'protocol'      : settings.editorService.protocol,
    'imageName'     : settings.editorService.docker.imageName
  });

  logger         = new OutputChannelLogger(settings);
  statusBar      = new PuppetStatusBar([puppetLangID, puppetFileLangID], context, logger);
  configSettings = new ConnectionConfiguration();

  extensionFeatures = [
    new PDKFeature(extContext, logger),
    new BoltFeature(extContext),
  ];

  if(settings.editorService.enable === false){
    notifyEditorServiceDisabled(extContext);
    reporter.sendTelemetryEvent('editorServiceDisabled');
    return;
  }

  if(checkInstallDirectory(settings, configSettings, logger) === false){
    // If this returns false, then we needed a local directory
    // but did not find it, so we should abort here
    // If we return true, we can continue
    // This can be revisited to enable disabling language server portion
    return;
  }

  switch (settings.editorService.protocol) {
    case ProtocolType.STDIO:
      connectionHandler = new StdioConnectionHandler(extContext, settings, statusBar, logger, configSettings);
      break;
    case ProtocolType.TCP:
      connectionHandler = new TcpConnectionHandler(extContext, settings, statusBar, logger, configSettings);
      break;
    case ProtocolType.DOCKER:
      connectionHandler = new DockerConnectionHandler(extContext, settings, statusBar, logger, configSettings);
      break;
  }

  extensionFeatures.push(new FormatDocumentFeature(puppetLangID, connectionHandler, settings, logger, extContext));
  extensionFeatures.push(new NodeGraphFeature(puppetLangID, connectionHandler, logger, extContext));
  extensionFeatures.push(new PuppetResourceFeature(extContext, connectionHandler, logger));
  extensionFeatures.push(new DebuggingFeature(debugType, settings, configSettings, extContext, logger));
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

function checkInstallDirectory(settings: ISettings, configSettings: IConnectionConfiguration, logger: ILogger) : boolean {
  if(settings.editorService.protocol === ProtocolType.DOCKER){
    return true;
  }
  if(settings.editorService.protocol === ProtocolType.TCP){
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

async function notifyEditorServiceDisabled(context: vscode.ExtensionContext) {
  const suppressEditorServicesDisabled = 'suppressEditorServicesDisabled';
  const dontShowAgainNotice = "Don't show again";

  if (context.globalState.get(suppressEditorServicesDisabled, false)) {
    return;
  }

  const result = await vscode.window.showInformationMessage(
    `Puppet Editor Services has been disabled. While syntax highlighting and grammar detection will still work, intellisense and other advanced features will not.`,
    { modal: false },
    { title: dontShowAgainNotice }
  );

  if (result === undefined) {
    return;
  }

  if (result.title === dontShowAgainNotice) {
    context.globalState.update(suppressEditorServicesDisabled, true);
  }
}
