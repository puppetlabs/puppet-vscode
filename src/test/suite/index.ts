import * as glob from 'glob';
import * as Mocha from 'mocha';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { IAggregateConfiguration } from '../../configuration';
import { ConnectionHandler } from '../../handler';
import { OutputChannelLogger } from '../../logging/outputchannel';
import { ISettings, defaultWorkspaceSettings } from '../../settings';

export const puppetLangID = 'puppet';
export const puppetFileLangID = 'puppetfile';
export let extContext: vscode.ExtensionContext;
export let logger: OutputChannelLogger;
export let configSettings: IAggregateConfiguration;
export let connectionHandler: ConnectionHandler;
export const settings: ISettings = defaultWorkspaceSettings();
// create sinon sandbox to enable stubbing and mocking
export const sandbox = sinon.createSandbox();

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
