import * as assert from 'assert';

import { CreateAggregrateConfiguration } from '../configuration';
import { DefaultWorkspaceSettings, ISettings, PuppetInstallType } from '../settings';

suite("Configuration Tests", () => {
  var pdkBinDir = '';
  var pdkPuppetBaseDir = '';
  var puppetBaseDir = '';

  switch(process.platform){
    case 'win32':
      pdkPuppetBaseDir = 'C:\\Program Files\\Puppet Labs\\DevelopmentKit';
      pdkBinDir        = 'C:\\Program Files\\Puppet Labs\\DevelopmentKit\\bin';
      puppetBaseDir    = 'C:\\Program Files\\Puppet Labs\\Puppet';
      break;
    default:
      pdkPuppetBaseDir = '/opt/puppetlabs/pdk';
      pdkBinDir        = '/opt/puppetlabs/pdk/bin';
      puppetBaseDir    = '/opt/puppetlabs';
      break;
  }

  test("resolves puppetBaseDir as puppet with default installtype", () => {
    const settings: ISettings = DefaultWorkspaceSettings();
    var config = CreateAggregrateConfiguration(settings);
    assert.equal(config.ruby.puppetBaseDir, puppetBaseDir);
  });

  test("resolves puppetBaseDir as puppet with installtype eq puppet", () => {
    const settings: ISettings = DefaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PUPPET;
    var config = CreateAggregrateConfiguration(settings);
    assert.equal(config.ruby.puppetBaseDir, puppetBaseDir);
  });

  test("resolves puppetBaseDir as pdk with installtype eq pdk", () => {
    const settings: ISettings = DefaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    var config = CreateAggregrateConfiguration(settings);
    assert.equal(config.ruby.puppetBaseDir, pdkPuppetBaseDir);
  });

  test("resolves pdkBinDir with installtype eq pdk", () => {
    const settings: ISettings = DefaultWorkspaceSettings();
    settings.installType = PuppetInstallType.PDK;
    var config = CreateAggregrateConfiguration(settings);
    assert.equal(config.ruby.pdkBinDir, pdkBinDir);
  });
});
