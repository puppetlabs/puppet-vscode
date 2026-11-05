import * as assert from 'assert';
import * as fs from 'fs';
import { after, before, describe, it } from 'mocha';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { FormatDocumentFeature } from '../../../feature/FormatDocumentFeature';
import { StdioConnectionHandler } from '../../../handlers/stdio';
import * as index from '../index';

describe('FormatDocumentFeature Test Suite', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-test-'));
  const tempFilePath = path.join(tempDir, 'manifest.pp');
  let sandbox: sinon.Sandbox;
  let connectionHandler: StdioConnectionHandler;

  before(() => {
    sandbox = sinon.createSandbox();
    connectionHandler = sandbox.createStubInstance(StdioConnectionHandler);
  });

  after(() => {
    sandbox.restore();
  });

  it('Formats a document with linting errors', async () => {
    // Create a manifest with linting error (missing whitespace before the opening brace)
    const manifestContent = `
      file{'/tmp/test':
      ensure => present,
      }
    `.split('\n').map(line => line.trim()).join('\n').trim();
    // Write the manifest to a temporary file
    fs.writeFileSync(tempFilePath, manifestContent);

    // Create a new FormatDocumentFeature instance
    const feature = new FormatDocumentFeature(index.puppetLangID, connectionHandler, index.configSettings, index.logger, index.extContext);
    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(tempFilePath);
    const range = new vscode.Range(new vscode.Position(0, 4), new vscode.Position(0, 5));
    const mockTextEdits = [vscode.TextEdit.replace(range, ' {')]; // Add the missing whitespace, we arent testing puppet-lint here
    // Stub the formatTextEdits method to return the mockTextEdits
    const provider = feature.getProvider();
    const formatTextEditsStub = sandbox.stub(provider, 'formatTextEdits');
    formatTextEditsStub.returns(Promise.resolve(mockTextEdits));

    // Format the document
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand('editor.action.formatDocument');

    // Read the formatted document
    const formattedDocument = await vscode.workspace.openTextDocument(tempFilePath);
    const formattedContent = formattedDocument.getText();

    // Assert that the document was formatted
    assert.notStrictEqual(formattedContent, manifestContent);

    assert.strictEqual(formattedContent, `
                      file {'/tmp/test':
                      ensure => present,
                      }
                      `.split('\n').map(line => line.trim()).join('\n').trim());

    formatTextEditsStub.restore();
  });

  it('formatTextEdits returns empty array when language client is not running', async () => {
    const feature = new FormatDocumentFeature(index.puppetLangID, connectionHandler, index.configSettings, index.logger, index.extContext);
    const provider = feature.getProvider();
    // connectionHandler is a stub with status undefined (not RunningLoaded/RunningLoading)
    const document = { uri: { toString: () => 'file:///test.pp' }, lineCount: 10 } as any;
    sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);
    const result = await provider.formatTextEdits(document, {} as any);
    assert.deepEqual(result, []);
  });

  it('does not register formatter when format.enable is false', () => {
    const registerFormatterStub = sandbox.stub(vscode.languages, 'registerDocumentFormattingEditProvider');
    const configWithFormatDisabled = {
      ...index.configSettings,
      workspace: {
        ...index.configSettings.workspace,
        format: { enable: false },
      },
    } as any;
    const feature = new FormatDocumentFeature(index.puppetLangID, connectionHandler, configWithFormatDisabled, index.logger, index.extContext);
    sinon.assert.notCalled(registerFormatterStub);
    assert.ok(feature);
  });


  it('formatTextEdits returns edits when connection is running and fixes applied', async () => {
    const feature = new FormatDocumentFeature(index.puppetLangID, connectionHandler, index.configSettings, index.logger, index.extContext);
    const provider = feature.getProvider();

    // Make status return RunningLoaded
    sandbox.stub(Object.getPrototypeOf(connectionHandler), 'status').get(() => {
      const { ConnectionStatus } = require('../../../interfaces');
      return ConnectionStatus.RunningLoaded;
    });
    const mockClient = {
      sendRequest: sandbox.stub().resolves({ fixesApplied: 1, newContent: 'fixed content' }),
    };
    sandbox.stub(connectionHandler, 'languageClient').get(() => mockClient);

    const document = {
      uri: { toString: () => 'file:///test.pp' },
      lineCount: 5,
    } as any;
    const result = await provider.formatTextEdits(document, {} as any);
    assert.equal(result.length, 1);
  });

  it('formatTextEdits returns empty array when no fixes applied', async () => {
    const feature = new FormatDocumentFeature(index.puppetLangID, connectionHandler, index.configSettings, index.logger, index.extContext);
    const provider = feature.getProvider();

    sandbox.stub(Object.getPrototypeOf(connectionHandler), 'status').get(() => {
      const { ConnectionStatus } = require('../../../interfaces');
      return ConnectionStatus.RunningLoaded;
    });
    const mockClient = {
      sendRequest: sandbox.stub().resolves({ fixesApplied: 0, newContent: undefined }),
    };
    sandbox.stub(connectionHandler, 'languageClient').get(() => mockClient);

    const document = {
      uri: { toString: () => 'file:///test.pp' },
      lineCount: 5,
    } as any;
    const result = await provider.formatTextEdits(document, {} as any);
    assert.deepEqual(result, []);
  });

  it('formatTextEdits sends telemetry when reporter exists', async () => {
    const feature = new FormatDocumentFeature(index.puppetLangID, connectionHandler, index.configSettings, index.logger, index.extContext);
    const provider = feature.getProvider();
    const { reporter } = require('../../../telemetry');

    sandbox.stub(Object.getPrototypeOf(connectionHandler), 'status').get(() => {
      const { ConnectionStatus } = require('../../../interfaces');
      return ConnectionStatus.RunningLoading;
    });
    const mockClient = {
      sendRequest: sandbox.stub().resolves({ fixesApplied: 0, newContent: undefined }),
    };
    sandbox.stub(connectionHandler, 'languageClient').get(() => mockClient);
    const telemetrySpy = sandbox.stub(reporter, 'sendTelemetryEvent');

    const document = {
      uri: { toString: () => 'file:///test.pp' },
      lineCount: 5,
    } as any;
    await provider.formatTextEdits(document, {} as any);
    sinon.assert.calledWith(telemetrySpy, 'puppet/FormatDocument');
  });


  it('dispose returns undefined (line 86)', () => {
    const feature = new FormatDocumentFeature(index.puppetLangID, connectionHandler, index.configSettings, index.logger, index.extContext);
    const result = feature.dispose();
    assert.strictEqual(result, undefined);
  });

});
