import * as assert from 'assert';

import { describe, it } from 'mocha';
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
