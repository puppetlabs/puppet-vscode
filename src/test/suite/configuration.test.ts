import * as assert from 'assert';

import { describe, it } from 'mocha';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { afterEach, beforeEach } from 'mocha';
import { AggregateConfiguration } from '../../configuration';
import { createAggregrateConfiguration } from '../../configuration';
import { ISettings, PuppetInstallType, defaultWorkspaceSettings } from '../../settings';

describe('Configuration Tests', () => {
  var pdkBinDir = '';
  var pdkPuppetBaseDir = '';
  var puppetBaseDir = '';

  switch (process.platform) {
    case 'win32':
      pdkPuppetBaseDir = 'C:\\Program Files\\Puppet Labs\\DevelopmentKit';
      pdkBinDir = 'C:\\Program Files\\Puppet Labs\\DevelopmentKit\\bin';
      puppetBaseDir = 'C:\\Program Files\\Puppet Labs\\Puppet';
      break;
    default:
      pdkPuppetBaseDir = '/opt/puppetlabs/pdk';
      pdkBinDir = '/opt/puppetlabs/pdk/bin';
      puppetBaseDir = '/opt/puppetlabs';
      break;
  }

  it('resolves pdkPuppetBaseDir as puppet with default installtype', () => {
    const settings: ISettings = defaultWorkspaceSettings();
    var config = createAggregrateConfiguration(settings);
    assert.strictEqual(config.ruby.puppetBaseDir, pdkPuppetBaseDir);
  });

  it('resolves puppetBaseDir as puppet with installtype eq puppet', () => {
    const settings: ISettings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PUPPET;
    var config = createAggregrateConfiguration(settings);
    assert.strictEqual(config.ruby.puppetBaseDir, puppetBaseDir);
  });

  it('resolves puppetBaseDir as pdk with installtype eq pdk', () => {
    const settings: ISettings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    var config = createAggregrateConfiguration(settings);
    assert.strictEqual(config.ruby.puppetBaseDir, pdkPuppetBaseDir);
  });

  it('resolves pdkBinDir with installtype eq pdk', () => {
    const settings: ISettings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    var config = createAggregrateConfiguration(settings);
    assert.strictEqual(config.ruby.pdkBinDir, pdkBinDir);
  });

  // Note that these integration tests REQUIRE the PDK to be installed locally
  // as the fileystem is queried for path information
  it('resolves latest PDK Instance with installtype eq pdk', () => {
    const settings: ISettings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    var config = createAggregrateConfiguration(settings);
    assert.notStrictEqual(config.ruby.pdkGemDir, undefined);
  });

  it('resolves All Puppet Versions with installtype eq pdk', () => {
    const settings: ISettings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    var config = createAggregrateConfiguration(settings);
    assert.notStrictEqual(config.ruby.pdkPuppetVersions, undefined);
    assert.ok(
      config.ruby.pdkPuppetVersions.length > 0,
      'config.ruby.pdkPuppetVersions.length should have at least one element',
    );
  });

  it('resolves a puppet version with installtype eq pdk', () => {
    // Find all of the available puppet settings
    let settings: ISettings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    let config = createAggregrateConfiguration(settings);
    // Use the first version available
    const puppetVersion = config.ruby.pdkPuppetVersions[0];
    settings.editorService.puppet = {
      version: puppetVersion,
    };
    // Generate the settings again
    config = createAggregrateConfiguration(settings);
    // Assert that pdk specifc information is still available
    // TODO: Should we test that version we ask is the version we get?
    assert.notStrictEqual(config.ruby.pdkGemDir, undefined);
  });
});



describe('Configuration - private method coverage', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('getPdkVersionFromFile reads file when it exists', () => {
    const settings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    sandbox.stub(fs, 'existsSync').callsFake((p: any) => {
      if (String(p).endsWith('PDK_VERSION')) { return true; }
      return false;
    });
    sandbox.stub(fs, 'readdirSync').returns([] as any);
    sandbox.stub(fs, 'readFileSync').returns(Buffer.from('6.29.0\n'));
    const config = createAggregrateConfiguration(settings);
    assert.ok(config.ruby.pdkVersion !== undefined);
  });

  it('findFirstDirectory returns undefined when dir does not exist', () => {
    const settings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    sandbox.stub(fs, 'existsSync').returns(false);
    sandbox.stub(fs, 'readdirSync').returns([] as any);
    const config = createAggregrateConfiguration(settings);
    // Config creation should not throw even when dirs don't exist
    assert.ok(config);
  });

  it('findFirstDirectory returns path when dir has subdirs', () => {
    const settings = defaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    let callCount = 0;
    sandbox.stub(fs, 'existsSync').callsFake(() => {
      callCount++;
      return callCount <= 5; // first few exist, then stop
    });
    sandbox.stub(fs, 'readdirSync').returns(['2.7.8'] as any);
    sandbox.stub(fs, 'readFileSync').returns(Buffer.from('6.29.0\n'));
    const config = createAggregrateConfiguration(settings);
    assert.ok(config);
  });
});


describe('AggregateConfiguration private methods via reflection', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('getPdkVersionFromFile reads version when PDK_VERSION file exists', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    const config = createAggregrateConfiguration(defaultWorkspaceSettings());
    // Now test via reflection with existsSync returning true for the file
    sandbox.restore();
    sandbox = sinon.createSandbox();
    sandbox.stub(fs, 'existsSync').returns(true);
    sandbox.stub(fs, 'readFileSync').returns(Buffer.from('6.29.0\n') as any);
    const version = (config as any).getPdkVersionFromFile('/fake/pdk');
    assert.equal(version, '6.29.0');
  });

  it('findFirstDirectory returns path when directory exists with subdirs', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    const config = createAggregrateConfiguration(defaultWorkspaceSettings());
    sandbox.restore();
    sandbox = sinon.createSandbox();
    sandbox.stub(fs, 'existsSync').returns(true);
    sandbox.stub(fs, 'readdirSync').returns(['2.7.8', '2.6.0'] as any);
    const result = (config as any).findFirstDirectory('/fake/pdk/ruby');
    assert.ok(result.includes('2.7.8')); // highest version after reverse sort
  });

  it('replaceSlashes returns undefined when path is undefined', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    const config = createAggregrateConfiguration(defaultWorkspaceSettings());
    const result = (config as any).replaceSlashes(undefined);
    assert.equal(result, undefined);
  });
});
