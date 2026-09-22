import * as sinon from 'sinon';
import * as vscode from 'vscode';
import axios from 'axios';
import { afterEach, beforeEach } from 'mocha';
import * as assert from 'assert';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { createAggregrateConfiguration } from '../../configuration';
import * as forge from '../../forge';
import { OutputChannelLogger } from '../../logging/outputchannel';
import { settingsFromWorkspace } from '../../settings';

describe('Forge Tests', () => {

  const settings = settingsFromWorkspace();
  const configSettings = createAggregrateConfiguration(settings);
  const logger = new OutputChannelLogger(configSettings.workspace.editorService.loglevel);

  it('Retrieves latest PDK version', () => {
    return forge.getPDKVersion(logger).then((version) => {
      let versionRegex = new RegExp('^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$');
      assert.notStrictEqual(version, undefined);
      expect(versionRegex.test(version)).to.be.true;
    });
  });

  it('Fails to retrieve invalid module', () => {
    return forge.getModuleInfo('puppetlabs-somefakemodule-1', logger).then((info) => {
      assert.strictEqual(info, undefined);
    });
  });

  it('Retrieves module info', () => {
    return forge.getModuleInfo('puppetlabs-stdlib', logger).then((info) => {
      assert.notStrictEqual(info, undefined);
      assert.strictEqual(info.uri, '/v3/modules/puppetlabs-stdlib');
      assert.strictEqual(info.slug, 'puppetlabs-stdlib');
      assert.strictEqual(info.owner.username, 'puppetlabs');
      assert.strictEqual(info.name, 'stdlib');
    })
  });

  it('Builds valid markdown', () => {
    const info: forge.PuppetForgeModuleInfo = {
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
      version: 0,
      summary: 'summary',
    };
    const markdown = forge.buildMarkdown(info);
    assert.notStrictEqual(markdown, undefined);
    assert.strictEqual(`## puppetlabs/stdlib\n
summary\n
**Latest version:** 0 (${info.updated.toDateString()})\n
**Forge**: [https://forge.puppet.com/modules/puppetlabs/stdlib](https://forge.puppet.com/modules/puppetlabs/stdlib)\n
**Project**: [https://github.com/puppetlabs/puppetlabs-stdlib](https://github.com/puppetlabs/puppetlabs-stdlib)\n
**Owner:** puppetlabs\n
**Endorsement:** SUPPORTED\n
**Score:** 0\n
`, markdown.value);
  });

  it('Returns an empty module completion list when passed invalid characters', () => {
    // module names cannot start with integers
    return forge.getPuppetModuleCompletion('12345612-', logger).then((info) => {
      expect(info.modules).to.eql([]);
      expect(info.total).to.eql(0);
    });
  });

  it('Retrieves module completion list', () => {
    return forge.getPuppetModuleCompletion('puppetlabs-', logger).then((info) => {
      assert.notStrictEqual(info, undefined);
      expect(info.total).to.be.greaterThan(0);
      expect(info.modules).to.include('puppetlabs-stdlib');
    });
  });
});


describe('Forge Tests - error paths (mocked)', () => {
  let sandbox: sinon.SinonSandbox;
  const logger = new OutputChannelLogger('error');

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Stub extensions.getExtension so getVersion() doesn't fail
    sandbox.stub(vscode.extensions, 'getExtension').returns({ packageJSON: { version: '1.0.0' } } as any);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('getPDKVersion handles non-200 response', async () => {
    sandbox.stub(axios, 'get').resolves({ status: 500, statusText: 'Server Error', data: '' });
    const logErrorStub = sandbox.stub(logger, 'error');
    await forge.getPDKVersion(logger);
    sinon.assert.calledOnce(logErrorStub);
  });

  it('getModuleInfo handles non-200 response', async () => {
    sandbox.stub(axios, 'get').resolves({ status: 404, statusText: 'Not Found', data: {} });
    const logErrorStub = sandbox.stub(logger, 'error');
    const result = await forge.getModuleInfo('puppetlabs-fake', logger);
    assert.strictEqual(result, undefined);
  });

  it('getModuleInfo handles network error', async () => {
    sandbox.stub(axios, 'get').rejects(new Error('Network error'));
    const result = await forge.getModuleInfo('puppetlabs-fake', logger);
    assert.strictEqual(result, undefined);
  });

  it('getModuleCompletions handles non-200 response', async () => {
    sandbox.stub(axios, 'get').resolves({ status: 503, statusText: 'Service Unavailable', data: {} });
    const logErrorStub = sandbox.stub(logger, 'error');
    await forge.getPuppetModuleCompletion('puppet', logger);
    sinon.assert.calledOnce(logErrorStub);
  });

  it('getModuleCompletions handles network error', async () => {
    sandbox.stub(axios, 'get').rejects(new Error('Connection refused'));
    const logErrorStub = sandbox.stub(logger, 'error');
    const result = await forge.getPuppetModuleCompletion('puppet', logger);
    assert.strictEqual(result, undefined);
    sinon.assert.calledOnce(logErrorStub);
  });
});
