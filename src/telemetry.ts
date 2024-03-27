/* eslint-disable @typescript-eslint/no-use-before-define */
import TelemetryReporter from '@vscode/extension-telemetry';
import * as vscode from 'vscode';

export const reporter: TelemetryReporter = getTelemetryReporter();

function getTelemetryReporter() {
  const pkg = getPackageInfo();
  const reporter: TelemetryReporter = new TelemetryReporter(pkg.aiKey);
  return reporter;
}

function getPackageInfo(): IPackageInfo {
  const pkg = vscode.extensions.getExtension('puppet.puppet-vscode');
  return {
    aiKey: pkg.packageJSON.aiKey,
  };
}

interface IPackageInfo {
  aiKey: string;
}
