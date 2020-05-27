import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';

export const reporter: TelemetryReporter = getTelemetryReporter();

function getTelemetryReporter() {
  const pkg = getPackageInfo();
  const reporter: TelemetryReporter = new TelemetryReporter(pkg.name, pkg.version, pkg.aiKey);
  return reporter;
}

function getPackageInfo(): IPackageInfo {
  const pkg = vscode.extensions.getExtension('puppet.puppet-vscode');
  return {
    name: pkg.packageJSON.name,
    version: pkg.packageJSON.version,
    aiKey: pkg.packageJSON.aiKey,
  };
}

interface IPackageInfo {
  name: string;
  version: string;
  aiKey: string;
}
