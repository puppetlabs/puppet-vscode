import vscode = require('vscode');
import TelemetryReporter from 'vscode-extension-telemetry';

export var reporter: TelemetryReporter;

export class Reporter extends vscode.Disposable {
  constructor(ctx: vscode.ExtensionContext) {
    super(() => reporter.dispose());
    let packageInfo = getPackageInfo(ctx);
    reporter = packageInfo && new TelemetryReporter(
      packageInfo.name,
      packageInfo.version,
      packageInfo.aiKey
    );
  }
}

interface IPackageInfo {
  name: string;
  version: string;
  aiKey: string;
}

function getPackageInfo(context: vscode.ExtensionContext): IPackageInfo {
  let extensionPackage = require(context.asAbsolutePath('./package.json'));
  return {
    name: extensionPackage.name,
    version: extensionPackage.version,
    aiKey: extensionPackage.aiKey
  };
}
