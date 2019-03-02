'use strict';

import * as fs from 'fs';
import * as vscode from 'vscode';
import { CreateAggregrateConfiguration, IAggregateConfiguration } from './configuration';
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
import { ConnectionType, ProtocolType } from './settings';
import { ILogger } from './logging';
import { OutputChannelLogger } from './logging/outputchannel';
import { PuppetStatusBar } from './PuppetStatusBar';
import { legacySettings, SettingsFromWorkspace } from './settings';
import { Reporter, reporter } from './telemetry/telemetry';

export const puppetLangID = 'puppet'; // don't change this
export const puppetFileLangID = 'puppetfile'; // don't change this
const debugType = 'Puppet';  // don't change this

let extContext: vscode.ExtensionContext;
let connectionHandler: ConnectionHandler;
let logger: OutputChannelLogger;
let statusBar: PuppetStatusBar;
let configSettings: IAggregateConfiguration;
let extensionFeatures: IFeature[] = [];

export function activate(context: vscode.ExtensionContext) {
  extContext = context;

  notifyOnNewExtensionVersion(extContext);
  checkForLegacySettings();

  context.subscriptions.push(new Reporter(extContext));

  const settings = SettingsFromWorkspace();
  reporter.sendTelemetryEvent('config', {
    'installType'   : settings.installType,
    'protocol'      : settings.editorService.protocol,
    'imageName'     : settings.editorService.docker.imageName
  });
  configSettings = CreateAggregrateConfiguration(settings);

  logger         = new OutputChannelLogger(configSettings.workspace.editorService.loglevel);
  statusBar      = new PuppetStatusBar([puppetLangID, puppetFileLangID], context, logger);

  extensionFeatures = [
    new PDKFeature(extContext, logger),
    new BoltFeature(extContext),
  ];

  if (configSettings.workspace.editorService.enable === false){
    notifyEditorServiceDisabled(extContext);
    reporter.sendTelemetryEvent('editorServiceDisabled');
    return;
  }

  if (checkInstallDirectory(configSettings, logger) === false){
    // If this returns false, then we needed a local directory
    // but did not find it, so we should abort here
    // If we return true, we can continue
    // This can be revisited to enable disabling language server portion
    return;
  }

  switch (configSettings.workspace.editorService.protocol) {
    case ProtocolType.STDIO:
      connectionHandler = new StdioConnectionHandler(extContext, statusBar, logger, configSettings);
      break;
    case ProtocolType.TCP:
      connectionHandler = new TcpConnectionHandler(extContext, statusBar, logger, configSettings);
      break;
    case ProtocolType.DOCKER:
      connectionHandler = new DockerConnectionHandler(extContext, statusBar, logger, configSettings);
      break;
  }

  extensionFeatures.push(new FormatDocumentFeature(puppetLangID, connectionHandler, configSettings, logger, extContext));
  extensionFeatures.push(new NodeGraphFeature(puppetLangID, connectionHandler, logger, extContext));
  extensionFeatures.push(new PuppetResourceFeature(extContext, connectionHandler, logger));
  extensionFeatures.push(new DebuggingFeature(debugType, configSettings, extContext, logger));
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

function checkInstallDirectory(config: IAggregateConfiguration, logger: ILogger) : boolean {
  if (config.workspace.editorService.protocol === ProtocolType.DOCKER) {
    return true;
  }
  if (config.workspace.editorService.protocol === ProtocolType.TCP) {
    if (config.connection.type === ConnectionType.Remote) {
      // Return if we are connecting to a remote TCP LangServer
      return true;
    }
  }

  // we want to check directory if STDIO or Local TCP
  if (!fs.existsSync(config.ruby.puppetBaseDir)) {
    showErrorMessage(
      `Could not find a valid Puppet installation at '${
        config.ruby.puppetBaseDir
      }'. While syntax highlighting and grammar detection will still work, intellisense and other advanced features will not.`,
      'Troubleshooting Information',
      'https://github.com/lingua-pupuli/puppet-vscode#experience-a-problem',
      logger
    );
    return false;
  } else {
    logger.debug('Found a valid Puppet installation at ' + config.ruby.puppetDir);
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
