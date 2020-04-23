'use strict';

import * as fs from 'fs';
import * as vscode from 'vscode';
import { CreateAggregrateConfiguration, IAggregateConfiguration } from './configuration';
import { IFeature } from './feature';
import { BoltFeature } from './feature/BoltFeature';
import { DebuggingFeature } from './feature/DebuggingFeature';
import { FormatDocumentFeature } from './feature/FormatDocumentFeature';
import { UpdateConfigurationFeature } from './feature/UpdateConfigurationFeature';
import { PDKFeature } from './feature/PDKFeature';
import { PuppetResourceFeature } from './feature/PuppetResourceFeature';
import { PuppetStatusBarFeature } from './feature/PuppetStatusBarFeature';
import { ConnectionHandler } from './handler';
import { StdioConnectionHandler } from './handlers/stdio';
import { TcpConnectionHandler } from './handlers/tcp';
import { ConnectionType, ProtocolType, PuppetInstallType, ISettings } from './settings';
import { ILogger } from './logging';
import { OutputChannelLogger } from './logging/outputchannel';
import { legacySettings, SettingsFromWorkspace } from './settings';
import { reporter } from './telemetry';
import { PuppetModuleHoverFeature } from './feature/PuppetModuleHoverFeature';
import { PuppetNodeGraphFeature } from './feature/PuppetNodeGraphFeature';

const axios = require('axios');

export const puppetLangID = 'puppet'; // don't change this
export const puppetFileLangID = 'puppetfile'; // don't change this
const debugType = 'Puppet'; // don't change this

let extContext: vscode.ExtensionContext;
let connectionHandler: ConnectionHandler;
let logger: OutputChannelLogger;
let configSettings: IAggregateConfiguration;
let extensionFeatures: IFeature[] = [];

export function activate(context: vscode.ExtensionContext) {
  let pkg = vscode.extensions.getExtension('jpogran.puppet-vscode');
  if (pkg){
    let message = 'The "jpogran.puppet-vscode" extension has been detected, which will conflict with the "puppet.puppet-vscode" extension. This will cause problems activating when each extension tries to load at the same time and may cause errors. Please uninstall it by executing the following from the commandline: "code --uninstall-extension jpogran.puppet-vscode"';
    vscode.window.showWarningMessage(
      message,
      { modal: false },
    );
  }

  extContext = context;

  setLanguageConfiguration();

  notifyOnNewExtensionVersion(extContext);

  checkForLegacySettings();

  const settings = SettingsFromWorkspace();
  const previousInstallType = settings.installType;
  configSettings = CreateAggregrateConfiguration(settings);
  logger = new OutputChannelLogger(configSettings.workspace.editorService.loglevel);
  if (configSettings.workspace.installType !== previousInstallType) {
    logger.debug(
      `Installation type has changed from ${previousInstallType} to ${configSettings.workspace.installType}`
    );
  }

  reporter.sendTelemetryEvent('config', {
    installType: configSettings.workspace.installType,
    protocol: configSettings.workspace.editorService.protocol,
    pdkVersion: configSettings.ruby.pdkVersion
  });

  const statusBar = new PuppetStatusBarFeature([puppetLangID, puppetFileLangID], configSettings, logger, context);

  extensionFeatures = [
    new PDKFeature(extContext, logger),
    new BoltFeature(extContext),
    new UpdateConfigurationFeature(logger, extContext),
    statusBar
  ];

  if (configSettings.workspace.editorService.enable === false) {
    notifyEditorServiceDisabled(extContext);
    reporter.sendTelemetryEvent('editorServiceDisabled');
    return;
  }

  if (checkInstallDirectory(configSettings, logger) === false) {
    // If this returns false, then we needed a local directory
    // but did not find it, so we should abort here
    // If we return true, we can continue
    // This can be revisited to enable disabling language server portion
    return;
  }

  // this happens after checkInstallDirectory so that we don't check pdk version
  // if it's not installed
  if (settings.pdk.checkVersion) {
    notifyIfNewPDKVersion(extContext, configSettings);
  }

  switch (configSettings.workspace.editorService.protocol) {
    case ProtocolType.STDIO:
      connectionHandler = new StdioConnectionHandler(extContext, statusBar, logger, configSettings);
      break;
    case ProtocolType.TCP:
      connectionHandler = new TcpConnectionHandler(extContext, statusBar, logger, configSettings);
      break;
  }

  extensionFeatures.push(
    new FormatDocumentFeature(puppetLangID, connectionHandler, configSettings, logger, extContext)
  );
  extensionFeatures.push(new PuppetNodeGraphFeature(puppetLangID, connectionHandler, logger, extContext));
  extensionFeatures.push(new PuppetResourceFeature(extContext, connectionHandler, logger));
  extensionFeatures.push(new DebuggingFeature(debugType, configSettings, extContext, logger));

  if (settings.hover.showMetadataInfo) {
    extensionFeatures.push(new PuppetModuleHoverFeature(extContext, logger));
  }
}

export function deactivate() {
  // Dispose all extension features
  extensionFeatures.forEach(feature => {
    feature.dispose();
  });

  if (connectionHandler !== undefined) {
    connectionHandler.stop();
  }
  reporter.dispose();
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

function checkInstallDirectory(config: IAggregateConfiguration, logger: ILogger): boolean {
  if (config.workspace.editorService.protocol === ProtocolType.TCP) {
    if (config.connection.type === ConnectionType.Remote) {
      // Return if we are connecting to a remote TCP LangServer
      return true;
    }
  }

  // we want to check directory if STDIO or Local TCP
  if (!fs.existsSync(config.ruby.puppetBaseDir)) {
    let message = '';
    // Need to use SettingsFromWorkspace() here because the AggregateConfiguration
    // changes the installType from Auto, to its calculated value
    if (SettingsFromWorkspace().installType === PuppetInstallType.AUTO) {
      let m = [
        'The extension failed to find a Puppet installation automatically in the default locations for PDK and for Puppet Agent.',
        'While syntax highlighting and grammar detection will still work, intellisense and other advanced features will not.'
      ];
      message = m.join(' ');
    } else {
      message = `Could not find a valid Puppet installation at '${config.ruby.puppetBaseDir}'. While syntax highlighting and grammar detection will still work, intellisense and other advanced features will not.`;
    }

    showErrorMessage(
      message,
      'Troubleshooting Information',
      'https://puppet-vscode.github.io/docs/experience-a-problem',
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
  const puppetExtension = vscode.extensions.getExtension('puppet.puppet-vscode')!;
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
      vscode.Uri.parse('https://marketplace.visualstudio.com/items/puppet.puppet-vscode/changelog')
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

async function notifyIfNewPDKVersion(context: vscode.ExtensionContext, settings: IAggregateConfiguration) {
  const suppressPDKUpdateCheck = 'suppressPDKUpdateCheck';
  const dontCheckAgainNotice = "Don't check again";
  const viewPDKDownloadPage = 'More info';

  if (context.globalState.get(suppressPDKUpdateCheck, false)) {
    return;
  }

  let version = '';
  if (settings.ruby.pdkVersion) {
    version = settings.ruby.pdkVersion;
  } else {
    // should we throw a warning here? technically this is only reached *if* a
    // PDK install is found, so the only way this is null is if the PDK_VERSION
    // file was removed.
    return;
  }

  axios
    .get('https://s3.amazonaws.com/puppet-pdk/pdk/LATEST')
    .then(response => {
      return response.data;
    })
    .then(latest_version => {
      if (version !== latest_version) {
        return vscode.window.showWarningMessage(
          `The installed PDK version is ${version}, the newest version is ${latest_version}. To find out how to update to the latest version click the more info button`,
          { modal: false },
          { title: dontCheckAgainNotice },
          { title: viewPDKDownloadPage }
        );
      }
    })
    .then(result => {
      if (result === undefined) {
        return;
      }

      if (result.title === dontCheckAgainNotice) {
        context.globalState.update(suppressPDKUpdateCheck, true);
      }

      if (result.title === viewPDKDownloadPage) {
        vscode.commands.executeCommand(
          'vscode.open',
          vscode.Uri.parse('https://puppet.com/download-puppet-development-kit')
        );
      }
    })
    .catch(error => {
      logger.error(error);
    });
}

function setLanguageConfiguration() {
  vscode.languages.setLanguageConfiguration(puppetLangID, {
    onEnterRules: [
      {
        // foo{'bar':}
        beforeText: /^.*{\s{0,}'.*':/,
        afterText: /\s{0,}}$/,
        action: {
          indentAction: vscode.IndentAction.IndentOutdent
        }
      }
    ],
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    comments: {
      lineComment: '#',
      blockComment: ['/*', '*/']
    }
  });
  vscode.languages.setLanguageConfiguration(puppetFileLangID, {
    onEnterRules: [],
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    comments: {
      lineComment: '#',
      blockComment: ['/*', '*/']
    }
  });
}
