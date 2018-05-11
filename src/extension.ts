'use strict';

import * as vscode from 'vscode';

import { ConnectionManager } from './connection';
import { ConnectionConfiguration } from './configuration';
import { OutputChannelLogger } from './logging/outputchannel';
import { Reporter } from './telemetry/telemetry';
import { PuppetExtensionConfiguration } from './puppetExtensionConfiguration';

var connManager: ConnectionManager;

export function activate(context: vscode.ExtensionContext) {
  const puppetExtension = vscode.extensions.getExtension('jpogran.puppet-vscode')!;
  const puppetExtensionVersion = puppetExtension.packageJSON.version;

  notifyOnNewExtensionVersion(context, puppetExtensionVersion);

  context.subscriptions.push(new Reporter(context));
  var logger = new OutputChannelLogger();

  var extensionConfig = new PuppetExtensionConfiguration(vscode.workspace.getConfiguration('puppet'));

  connManager = new ConnectionManager(context, logger, extensionConfig);

  var configSettings = new ConnectionConfiguration(context);
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
