import * as glob from 'glob';
import * as Mocha from 'mocha';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { IAggregateConfiguration, createAggregrateConfiguration } from '../../configuration';
import { OutputChannelLogger } from '../../logging/outputchannel';
import { ISettings, defaultWorkspaceSettings, settingsFromWorkspace } from '../../settings';

export const puppetLangID = 'puppet';
export const puppetFileLangID = 'puppetfile';
export const defaultSettings: ISettings = defaultWorkspaceSettings();
export const workspaceSettings: ISettings = settingsFromWorkspace();

export let configSettings: IAggregateConfiguration = createAggregrateConfiguration(workspaceSettings);
export let logger: OutputChannelLogger = new OutputChannelLogger(configSettings.workspace.editorService.loglevel);
// create sinon sandbox to enable stubbing and mocking
export const sandbox = sinon.createSandbox();

export const extContext: vscode.ExtensionContext = {
  extension: sandbox.stub(),
  asAbsolutePath: sandbox.stub(),
  storagePath: '/path/to/storage',
  globalStoragePath: '/path/to/global/storage',
  logPath: '/path/to/log',
  extensionUri: sandbox.stub(),
  environmentVariableCollection: sandbox.stub(),
  extensionMode: vscode.ExtensionMode.Production,
  globalStorageUri: sandbox.stub(),
  logUri: sandbox.stub(),
  storageUri: sandbox.stub(),
  subscriptions: [],
  globalState: sandbox.stub(),
  workspaceState: sandbox.stub(),
  secrets: sandbox.stub(),
  extensionPath: '/path/to/extension',
};

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        e(err);
      }
    });
  });
}
