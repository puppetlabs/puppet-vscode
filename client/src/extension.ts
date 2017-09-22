'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { ConnectionManager, IConnectionConfiguration, ConnectionType } from './connection';
import { ConnectionConfiguration } from './configuration';
import { ILogger } from './logging';
import { OutputChannelLogger } from './logging/outputchannel';
import { Reporter } from './telemetry/telemetry';

const langID = 'puppet'; // don't change this
var statusBarItem;
var serverProc;

var connManager: ConnectionManager = undefined;

export function activate(context: vscode.ExtensionContext) {
  const puppetExtension = vscode.extensions.getExtension('jpogran.puppet-vscode')!;
  const puppetExtensionVersion = puppetExtension.packageJSON.version;

  notifyOnNewExtensionVersion(context, puppetExtensionVersion)

  context.subscriptions.push(new Reporter(context));
  var logger = new OutputChannelLogger();
  connManager = new ConnectionManager(context, logger);

  var configSettings = new ConnectionConfiguration(context);
  connManager.start(configSettings);
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (connManager != undefined) {
    connManager.stop();
    connManager.dispose();
  }
}

async function notifyOnNewExtensionVersion(context: vscode.ExtensionContext, version: string) {
  const viewReleaseNotes = 'View Release Notes';
  const suppressUpdateNotice = 'SuppressUpdateNotice';
  const dontShowAgainNotice = "Don't show again";
  
  if (context.globalState.get(suppressUpdateNotice, false)) return;
  
  const result = await vscode.window.showInformationMessage(`Puppet VSCode has been updated to v${version}`, dontShowAgainNotice, undefined, viewReleaseNotes);
  if (result === viewReleaseNotes) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://marketplace.visualstudio.com/items/jpogran.puppet-vscode/changelog'));
  } else {
    context.globalState.update(suppressUpdateNotice, true);
  }
}
