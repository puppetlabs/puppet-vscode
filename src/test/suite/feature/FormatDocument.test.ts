import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { FormatDocumentFeature } from '../../../feature/FormatDocumentFeature';
import { StdioConnectionHandler } from '../../../handlers/stdio';
import * as index from '../index';

suite('FormatDocumentFeature Test Suite', () => {

  let connectionManager = index.sandbox.createStubInstance(StdioConnectionHandler);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-test-'));
  const tempFilePath = path.join(tempDir, 'manifest.pp');

  test('Formats a document with linting errors', async () => {
    // Create a manifest with linting error (missing whitespace before the opening brace)
    const manifestContent = `
      file{'/tmp/test':
      ensure => present,
      }
    `.split('\n').map(line => line.trim()).join('\n').trim();
    // Write the manifest to a temporary file
    fs.writeFileSync(tempFilePath, manifestContent);

    // Create a new FormatDocumentFeature instance
    const feature = new FormatDocumentFeature(index.puppetLangID, connectionManager, index.configSettings, index.logger, index.extContext);
    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(tempFilePath);
    const range = new vscode.Range(new vscode.Position(0, 4), new vscode.Position(0, 5));
    const mockTextEdits = [vscode.TextEdit.replace(range, ' {')]; // Add the missing whitespace, we arent testing puppet-lint here
    // Stub the formatTextEdits method to return the mockTextEdits
    const provider = feature.getProvider();
    const formatTextEditsStub = index.sandbox.stub(provider, 'formatTextEdits');
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
});
