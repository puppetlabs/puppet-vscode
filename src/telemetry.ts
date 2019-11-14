import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';


export const reporter:TelemetryReporter = getTelemetryReporter();

function getTelemetryReporter() {
  let pkg = getPackageInfo();
  let reporter:TelemetryReporter = new TelemetryReporter(
    pkg.name,
    pkg.version,
    pkg.aiKey
  );
  return reporter;
}

function getPackageInfo(): IPackageInfo {
  let pkg = vscode.extensions.getExtension('jpogran.puppet-vscode');
  return {	
    name: pkg.packageJSON.name,	
    version: pkg.packageJSON.version,	
    aiKey: pkg.packageJSON.aiKey	
  };	
}

interface IPackageInfo {	
  name: string;	
  version: string;	
  aiKey: string;	
}
