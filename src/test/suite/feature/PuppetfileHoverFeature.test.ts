import { assert } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { PuppetfileHoverFeature } from '../../../feature/PuppetfileHoverFeature';
import * as forge from '../../../forge';
import { ILogger } from '../../../logging';
import * as index from '../index';

suite('PuppetfileHoverFeature', () => {
  let context: vscode.ExtensionContext = index.extContext;
  let logger: ILogger = index.logger;

  // Stub the getModuleInfo function to return a known value, rather than make an actual api call
  const getModuleInfoStub = index.sandbox.stub(forge, 'getModuleInfo');
  getModuleInfoStub.returns(Promise.resolve({
    uri: '/v3/modules/puppetlabs-stdlib',
    slug: 'puppetlabs-stdlib',
    name: 'puppetlabs/stdlib',
    downloads: 0,
    score: 0,
    created: new Date(),
    updated: new Date(),
    endorsement: 'supported',
    owner: { slug: 'puppetlabs', username: 'puppetlabs' },
    forgeUrl: 'https://forge.puppet.com/modules/puppetlabs/stdlib',
    homepageUrl: 'https://github.com/puppetlabs/puppetlabs-stdlib',
  }));

  test('should register hover provider on construction', async () => {
    const feature = new PuppetfileHoverFeature(context, logger);
    // a simple Puppetfile with two modules
    const puppetfileContent = `
    mod 'puppetlabs-stdlib'
    mod 'puppetlabs-concat'
  `.split('\n').map(line => line.trim()).join('\n').trim();

    // Create a temporary file with the desired content
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-test-'));
    const tempFile = path.join(tempDir, 'Puppetfile');
    fs.writeFileSync(tempFile, puppetfileContent);

    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(tempFile);
    const position = new vscode.Position(1, 4);

    const hover = await vscode.commands.executeCommand('vscode.executeHoverProvider', document.uri, position);
    getModuleInfoStub.restore();

    assert.instanceOf(hover, Array);
    assert.isNotEmpty(hover);
    // test that the hover contains the some of the expected content
    assert.include(hover[0].contents[0].value, '**Forge**: [https://forge.puppet.com/modules/puppetlabs/stdlib](https://forge.puppet.com/modules/puppetlabs/stdlib)');
    assert.include(hover[0].contents[0].value, '**Project**: [https://github.com/puppetlabs/puppetlabs-stdlib](https://github.com/puppetlabs/puppetlabs-stdlib)');
  });

  test('should not throw on dispose', () => {
    const feature = new PuppetfileHoverFeature(context, logger);

    assert.doesNotThrow(() => feature.dispose());
  });
});
