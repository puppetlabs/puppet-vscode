import * as assert from 'assert';

import * as vscode from 'vscode';
import { ConnectionConfiguration } from '../configuration';
import { PuppetInstallType } from '../interfaces';

describe("Configuration Tests", () => {
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

  it("correct install type", () => {
    var config = new ConnectionConfiguration();
    assert.equal(PuppetInstallType.PUPPET, config.puppetInstallType);
  });

  it("resolves puppetBaseDir as puppet with default installtype", () => {
    var config = new ConnectionConfiguration();
    assert.equal(config.puppetBaseDir, puppetBaseDir);
  });

  it("resolves puppetBaseDir as puppet with installtype eq puppet", () => {
    var config = new ConnectionConfiguration();
    config.puppetInstallType = PuppetInstallType.PUPPET;
    assert.equal(config.puppetBaseDir, puppetBaseDir);
  });

  it("resolves pdkBinDir with installtype eq pdk", () => {
    var config = new ConnectionConfiguration();
    config.puppetInstallType = PuppetInstallType.PDK;
    assert.equal(config.pdkBinDir, pdkBinDir);
  });

});
