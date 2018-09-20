'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { ConnectionManager } from './connection';
import { ConnectionConfiguration } from './configuration';
import { OutputChannelLogger } from './logging/outputchannel';
import { Reporter } from './telemetry/telemetry';
import { IFeature } from "./feature";
import { setupPuppetCommands } from './commands/puppetcommands';
import { setupPDKCommands } from './commands/pdkcommands';
import { PuppetStatusBar } from './PuppetStatusBar';
import { ISettings, legacySettings, settingsFromWorkspace } from './settings';
import { DebugConfigurationFeature } from './feature/DebugConfigurationFeature';
import { NodeGraphFeature } from './feature/NodeGraphFeature';
import { PDKNewClassCommand } from './commands/pdk/pdkNewClassCommand';
import { PDKNewModuleCommand } from './commands/pdk/pdkNewModuleCommand';
import { PDKNewTaskCommand } from './commands/pdk/pdkNewTaskCommand';
import { PDKTestUnitCommand } from './commands/pdk/pdkTestCommand';

var connManager: ConnectionManager;
var commandsRegistered = false;
var terminal: vscode.Terminal;
const langID = 'puppet'; // don't change this
let extensionFeatures: IFeature[] = [];

export function activate(context: vscode.ExtensionContext) {
  const puppetExtension = vscode.extensions.getExtension('jpogran.puppet-vscode')!;
  const puppetExtensionVersion = puppetExtension.packageJSON.version;

  notifyOnNewExtensionVersion(context, puppetExtensionVersion);

  const settings: ISettings = settingsFromWorkspace();

  context.subscriptions.push(new Reporter(context));
  var logger = new OutputChannelLogger(settings);
  var statusBar = new PuppetStatusBar(langID, logger);
  var configSettings = new ConnectionConfiguration();

  // Raise a warning if we detect any legacy settings
  const legacySettingValues: Map<string, Object> = legacySettings();
  if (legacySettingValues.size > 0) {
    let settingNames: string[] = [];
    for (const [settingName, _value] of legacySettingValues) { settingNames.push(settingName); }
    vscode.window.showWarningMessage("Deprecated Puppet settings have been detected. Please either remove them or, convert them to the correct settings names. (" + settingNames.join(", ") + ")", { modal: false});
  }

  if (!fs.existsSync(configSettings.puppetBaseDir)) {
    var message = `Could not find a valid Puppet installation at '${
      configSettings.puppetBaseDir
    }'. While syntax highlighting and grammar detection will still work, intellisense and other advanced features will not.`;
    var title = 'Troubleshooting Information';
    var url = 'https://github.com/lingua-pupuli/puppet-vscode#experience-a-problem';

    logger.error(message);
    notifyErrorPuppetNotFound(message, title, url);
    return null;
  } else {
    logger.debug('Found a valid Puppet installation at ' + configSettings.puppetDir);
  }

  connManager = new ConnectionManager(context, logger, statusBar, configSettings);

  extensionFeatures = [
    new DebugConfigurationFeature(logger, context),
    new NodeGraphFeature(langID, connManager, logger, context),

    new PDKNewModuleCommand(context, logger, terminal),
    new PDKNewClassCommand(context, logger, terminal),
    new PDKNewTaskCommand(context, logger, terminal),
    new PDKTestUnitCommand(context, logger, terminal),
  ];

  if (!commandsRegistered) {
    logger.debug('Configuring commands');

    setupPuppetCommands(langID, connManager, settings, context, logger);

    terminal = vscode.window.createTerminal('Puppet PDK');
    terminal.processId.then(pid => {
      logger.debug('pdk shell started, pid: ' + pid);
    });
    setupPDKCommands(langID, connManager, context, logger, terminal);
    context.subscriptions.push(terminal);

    commandsRegistered = true;
  }

  connManager.start(configSettings);
}

// this method is called when your extension is deactivated
export function deactivate() {
  // Dispose all extension features
  extensionFeatures.forEach((feature) => {
    feature.dispose();
  });

  if (connManager !== undefined) {
    connManager.stop();
    connManager.dispose();
  }
}

async function notifyErrorPuppetNotFound(message:string, title:string, url:string){
  vscode.window.showErrorMessage(
    message, { modal: false }, { title: title }
  ).then(item => {
    if (item === undefined) { return; }
    if (item.title === title) {
      vscode.commands.executeCommand(
        'vscode.open', vscode.Uri.parse(url)
      );
    }
  });
}

async function notifyOnNewExtensionVersion(context: vscode.ExtensionContext, version: string) {
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
