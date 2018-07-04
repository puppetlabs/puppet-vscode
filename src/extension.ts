'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { ConnectionManager } from './connection';
import { ConnectionConfiguration } from './configuration';
import { OutputChannelLogger } from './logging/outputchannel';
import { Reporter } from './telemetry/telemetry';
import { setupPuppetCommands } from './commands/puppetcommands';
import { setupPDKCommands } from './commands/pdkcommands';
import { PuppetStatusBar } from './PuppetStatusBar';

var connManager: ConnectionManager;
var commandsRegistered = false;
var terminal: vscode.Terminal;
const langID = 'puppet'; // don't change this

export function activate(context: vscode.ExtensionContext) {
  const puppetExtension = vscode.extensions.getExtension('jpogran.puppet-vscode')!;
  const puppetExtensionVersion = puppetExtension.packageJSON.version;

  notifyOnNewExtensionVersion(context, puppetExtensionVersion);

  context.subscriptions.push(new Reporter(context));
  var logger = new OutputChannelLogger();
  var statusBar = new PuppetStatusBar(langID);
  var configSettings = new ConnectionConfiguration(context);

  if (!fs.existsSync(configSettings.puppetDir)) {
    logger.error('Could not find a valid Puppet installation at ' + configSettings.puppetDir);
    vscode.window
      .showErrorMessage(
        `Could not find a valid Puppet installation at '${
          configSettings.puppetDir
        }'. While syntax highlighting and grammar detection will still work, intellisense and other advanced features will not.`,
        { modal: false },
        { title: 'Troubleshooting Information' }
      )
      .then(item => {
        if (item === undefined) {
          return;
        }
        if (item.title === 'Troubleshooting Information') {
          vscode.commands.executeCommand(
            'vscode.open',
            vscode.Uri.parse('https://github.com/lingua-pupuli/puppet-vscode#experience-a-problem')
          );
        }
      });
    return null;
  } else {
    logger.debug('Found a valid Puppet installation at ' + configSettings.puppetDir);
  }

  connManager = new ConnectionManager(context, logger, statusBar, configSettings);

  if (!commandsRegistered) {
    logger.debug('Configuring commands');

    setupPuppetCommands(langID, connManager, context, logger);

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
  if (connManager !== undefined) {
    connManager.stop();
    connManager.dispose();
  }
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
