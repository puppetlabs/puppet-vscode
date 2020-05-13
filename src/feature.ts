import vscode = require('vscode');

export interface IFeature extends vscode.Disposable {
  dispose();
}
