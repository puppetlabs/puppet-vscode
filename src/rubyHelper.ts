import path = require('path');
import fs = require('fs');
import cp = require('child_process');
import { ILogger } from './logging';
import { IConnectionConfiguration } from './interfaces';

export class RubyHelper {
  private static getDirectories(parent:string) {
    return fs.readdirSync(parent).filter(function(file) {
      return fs.statSync(path.join(parent, file)).isDirectory();
    });
  }

  private static pathEnvSeparator() {
    if (process.platform === 'win32') {
      return ';';
    } else {
      return ':';
    }
  }

  public static getRubyEnvFromPuppetAgent(
    rubyFile:string,
    connectionConfiguration: IConnectionConfiguration,
    logger: ILogger
  ) {
    let logPrefix: string = '[getRubyExecFromPuppetAgent] ';
    // setup defaults
    let spawn_options: cp.SpawnOptions = {};
    spawn_options.env = process.env;
    let result = {
      command: 'ruby',
      args: [rubyFile],
      options: spawn_options
    };
    let puppetAgentDir: string = '';

    // type Platform = 'aix'
    //               | 'android'
    //               | 'darwin'
    //               | 'freebsd'
    //               | 'linux'
    //               | 'openbsd'
    //               | 'sunos'
    //               | 'win32';
    switch (process.platform) {
      case 'win32':
        let programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
        if (process.env['PROCESSOR_ARCHITEW6432'] === 'AMD64') {
          programFiles = process.env['ProgramW6432']  || 'C:\\Program Files';
        }

        if (connectionConfiguration.puppetAgentDir === null) {
          puppetAgentDir = path.join(programFiles, 'Puppet Labs', 'Puppet'); // tslint:disable-line
        } else {
          puppetAgentDir = connectionConfiguration.puppetAgentDir;
        }

        result.options.stdio = 'pipe';
        break;
      default:
        if (connectionConfiguration.puppetAgentDir === null) {
          puppetAgentDir = '/opt/puppetlabs/puppet';
        } else {
          puppetAgentDir = connectionConfiguration.puppetAgentDir;
        }

        result.options.stdio = 'pipe';
        result.options.shell = true;
        break;
    }

    let puppetDir = path.join(puppetAgentDir, 'puppet');
    let facterDir = path.join(puppetAgentDir, 'facter');
    let hieraDir = path.join(puppetAgentDir, 'hiera');
    let mcoDir = path.join(puppetAgentDir, 'mcollective');
    let rubydir = path.join(puppetAgentDir, 'sys', 'ruby');
    let rubylib =
      path.join(puppetDir, 'lib') +
      this.pathEnvSeparator() +
      path.join(facterDir, 'lib') +
      this.pathEnvSeparator() +
      path.join(hieraDir, 'lib') +
      this.pathEnvSeparator() +
      path.join(mcoDir, 'lib');

    if (process.platform === 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      rubylib = rubylib.replace(/\\/g, '/');
    }

    // Setup the process environment variables
    if (result.options.env.PATH === undefined) {
      result.options.env.PATH = '';
    }
    if (result.options.env.RUBYLIB === undefined) {
      result.options.env.RUBYLIB = '';
    }
    result.options.env.RUBY_DIR = rubydir;
    result.options.env.PATH =
      path.join(puppetDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(facterDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(hieraDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(mcoDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(puppetAgentDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(rubydir, 'bin') +
      this.pathEnvSeparator() +
      path.join(puppetAgentDir, 'sys', 'tools', 'bin') +
      this.pathEnvSeparator() +
      result.options.env.PATH;
    result.options.env.RUBYLIB = rubylib + this.pathEnvSeparator() + result.options.env.RUBYLIB;
    result.options.env.RUBYOPT = 'rubygems';
    result.options.env.SSL_CERT_FILE = path.join(puppetDir, 'ssl', 'cert.pem');
    result.options.env.SSL_CERT_DIR = path.join(puppetDir, 'ssl', 'certs');

    logger.debug(logPrefix + 'Using environment variable RUBY_DIR=' + result.options.env.RUBY_DIR);
    logger.debug(logPrefix + 'Using environment variable PATH=' + result.options.env.PATH);
    logger.debug(logPrefix + 'Using environment variable RUBYLIB=' + result.options.env.RUBYLIB);
    logger.debug(logPrefix + 'Using environment variable RUBYOPT=' + result.options.env.RUBYOPT);
    logger.debug(logPrefix + 'Using environment variable SSL_CERT_FILE=' + result.options.env.SSL_CERT_FILE);
    logger.debug(logPrefix + 'Using environment variable SSL_CERT_DIR=' + result.options.env.SSL_CERT_DIR);

    return result;
  }

  public static getRubyEnvFromPDK(rubyFile:string, connectionConfiguration: IConnectionConfiguration, logger: ILogger) {
    let logPrefix: string = '[getRubyEnvFromPDK] ';
    // setup defaults
    let spawn_options: cp.SpawnOptions = {};
    spawn_options.env = process.env;
    let result = {
      command: 'ruby',
      args: [rubyFile],
      options: spawn_options
    };
    let pdkDir: string = '';

    // type Platform = 'aix'
    //               | 'android'
    //               | 'darwin'
    //               | 'freebsd'
    //               | 'linux'
    //               | 'openbsd'
    //               | 'sunos'
    //               | 'win32';
    switch (process.platform) {
      case 'win32':
        let programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
        if (process.env['PROCESSOR_ARCHITEW6432'] === 'AMD64') {
          programFiles = process.env['ProgramW6432']  || 'C:\\Program Files';
        }

        pdkDir = path.join(programFiles, 'Puppet Labs', 'DevelopmentKit'); // tslint:disable-line

        result.options.stdio = 'pipe';
        break;
      default:
        pdkDir = '/opt/puppetlabs/pdk';

        result.options.stdio = 'pipe';
        result.options.shell = true;
        break;
    }
    // Check if this really is a PDK installation
    if (!fs.existsSync(path.join(pdkDir, 'PDK_VERSION'))) {
      logger.debug(logPrefix + 'Could not find a valid PDK installation at ' + pdkDir);
      return null;
    } else {
      logger.debug(logPrefix + 'Found a valid PDK installation at ' + pdkDir);
    }

    // Now to detect ruby versions
    let subdirs = this.getDirectories(path.join(pdkDir, 'private', 'ruby'));
    if (subdirs.length === 0) {
      return null;
    }
    let rubyDir = path.join(pdkDir, 'private', 'ruby', subdirs[0]);

    subdirs = this.getDirectories(path.join(pdkDir, 'share', 'cache', 'ruby'));
    if (subdirs.length === 0) {
      return null;
    }
    let gemDir = path.join(pdkDir, 'share', 'cache', 'ruby', subdirs[0]);

    let rubylib = path.join(pdkDir, 'lib');
    if (process.platform === 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      rubylib = rubylib.replace(/\\/g, '/');
      gemDir = gemDir.replace(/\\/g, '/');
    }

    // Setup the process environment variables
    if (result.options.env.PATH === undefined) {
      result.options.env.PATH = '';
    }
    if (result.options.env.RUBYLIB === undefined) {
      result.options.env.RUBYLIB = '';
    }

    result.options.env.RUBY_DIR = rubyDir;
    result.options.env.PATH =
      path.join(pdkDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(rubyDir, 'bin') +
      this.pathEnvSeparator() +
      result.options.env.PATH;
    result.options.env.RUBYLIB = path.join(pdkDir, 'lib') + this.pathEnvSeparator() + result.options.env.RUBYLIB;
    result.options.env.GEM_PATH = gemDir;
    result.options.env.GEM_HOME = gemDir;
    result.options.env.RUBYOPT = 'rubygems';

    logger.debug(logPrefix + 'Using environment variable RUBY_DIR=' + result.options.env.RUBY_DIR);
    logger.debug(logPrefix + 'Using environment variable PATH=' + result.options.env.PATH);
    logger.debug(logPrefix + 'Using environment variable RUBYLIB=' + result.options.env.RUBYLIB);
    logger.debug(logPrefix + 'Using environment variable GEM_PATH=' + result.options.env.GEM_PATH);
    logger.debug(logPrefix + 'Using environment variable GEM_HOME=' + result.options.env.GEM_HOME);
    logger.debug(logPrefix + 'Using environment variable RUBYOPT=' + result.options.env.RUBYOPT);

    return result;
  }
}
