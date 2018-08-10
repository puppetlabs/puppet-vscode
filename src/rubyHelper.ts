import path = require('path');
import fs = require('fs');
import cp = require('child_process');
import { ILogger } from './logging';
import { IConnectionConfiguration, PuppetInstallType } from './interfaces';
import { PathResolver } from './configuration/pathResolver';

export class RubyHelper {

  public static getRubyEnvFromConfiguration(
    rubyFile:string,
    connectionConfiguration: IConnectionConfiguration,
    logger: ILogger
  ):{
    command: string;
    args: string[];
    options: cp.SpawnOptions;
  } {

    // setup defaults
    let spawn_options: cp.SpawnOptions = {};
        spawn_options.env              = this.shallowCloneObject(process.env);
        spawn_options.stdio            = 'pipe';

    switch (process.platform) {
      case 'win32':
        break;
      default:
        spawn_options.shell = true;
        break;
    }

    if (spawn_options.env.PATH === undefined) { spawn_options.env.PATH = ''; }
    if (spawn_options.env.RUBYLIB === undefined) { spawn_options.env.RUBYLIB = ''; }

    let command = '';
    let logPrefix: string='';
    switch(connectionConfiguration.puppetInstallType){
      case PuppetInstallType.PDK:
        logPrefix                        = '[getRubyEnvFromPDK] ';
        spawn_options.env.DEVKIT_BASEDIR = connectionConfiguration.puppetBaseDir;
        spawn_options.env.RUBY_DIR       = connectionConfiguration.pdkRubyDir;
        spawn_options.env.RUBYLIB        = new Array(connectionConfiguration.pdkRubyLib, spawn_options.env.RUBYLIB).join(PathResolver.pathEnvSeparator());
        spawn_options.env.PATH           = new Array(connectionConfiguration.pdkBinDir, connectionConfiguration.pdkRubyBinDir, spawn_options.env.PATH).join(PathResolver.pathEnvSeparator());
        spawn_options.env.RUBYOPT        = 'rubygems';
        spawn_options.env.GEM_HOME       = connectionConfiguration.pdkGemDir;
        spawn_options.env.GEM_PATH       = new Array(connectionConfiguration.pdkGemVerDir, connectionConfiguration.pdkGemDir, connectionConfiguration.pdkRubyVerDir).join(PathResolver.pathEnvSeparator());
        command                          = path.join(connectionConfiguration.pdkRubyDir, 'bin', 'ruby');
        break;
      case PuppetInstallType.PUPPET:
        logPrefix                       = '[getRubyExecFromPuppetAgent] ';
        spawn_options.env.RUBY_DIR      = connectionConfiguration.rubydir;
        spawn_options.env.PATH          = new Array(connectionConfiguration.environmentPath, spawn_options.env.PATH).join(PathResolver.pathEnvSeparator());
        spawn_options.env.RUBYLIB       = new Array(connectionConfiguration.rubylib, spawn_options.env.RUBYLIB).join(PathResolver.pathEnvSeparator());
        spawn_options.env.RUBYOPT       = 'rubygems';
        spawn_options.env.SSL_CERT_FILE = connectionConfiguration.sslCertFile;
        spawn_options.env.SSL_CERT_DIR  = connectionConfiguration.sslCertDir;
        command                         = 'ruby';
        break;
    }

    logger.debug(logPrefix + 'Using environment variable RUBY_DIR='      + spawn_options.env.RUBY_DIR);
    logger.debug(logPrefix + 'Using environment variable PATH='          + spawn_options.env.PATH);
    logger.debug(logPrefix + 'Using environment variable RUBYLIB='       + spawn_options.env.RUBYLIB);
    logger.debug(logPrefix + 'Using environment variable RUBYOPT='       + spawn_options.env.RUBYOPT);
    logger.debug(logPrefix + 'Using environment variable SSL_CERT_FILE=' + spawn_options.env.SSL_CERT_FILE);
    logger.debug(logPrefix + 'Using environment variable SSL_CERT_DIR='  + spawn_options.env.SSL_CERT_DIR);
    logger.debug(logPrefix + 'Using environment variable GEM_PATH='      + spawn_options.env.GEM_PATH);
    logger.debug(logPrefix + 'Using environment variable GEM_HOME='      + spawn_options.env.GEM_HOME);

    let result = {
      command: command,
      args   : [rubyFile],
      options: spawn_options
    };

    return result;

  }

  private static shallowCloneObject(value:Object): Object {
    const clone: Object = {};
    for (const propertyName in value){
      if (value.hasOwnProperty(propertyName)){
        clone[propertyName] = value[propertyName];
      }
    }
    return clone;
  }
}
