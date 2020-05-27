import * as path from 'path';
import * as vscode from 'vscode';
import { Executable } from 'vscode-languageclient';
import { IAggregateConfiguration } from '../configuration';
import { PathResolver } from '../configuration/pathResolver';
import { ProtocolType, PuppetInstallType } from '../settings';

export class CommandEnvironmentHelper {
  public static getLanguageServerRubyEnvFromConfiguration(
    languageServerpath: string,
    config: IAggregateConfiguration,
  ): Executable {
    const exe: Executable = {
      command: this.buildExecutableCommand(config),
      args: this.buildLanguageServerArguments(languageServerpath, config),
      options: {},
    };
    this.applyRubyEnvFromConfiguration(exe, config);
    return exe;
  }

  public static getDebugServerRubyEnvFromConfiguration(
    debugServerpath: string,
    config: IAggregateConfiguration,
  ): Executable {
    const exe: Executable = {
      command: this.buildExecutableCommand(config),
      args: this.buildDebugServerArguments(debugServerpath),
      options: {},
    };
    this.applyRubyEnvFromConfiguration(exe, config);
    return exe;
  }

  private static applyRubyEnvFromConfiguration(exe: Executable, config: IAggregateConfiguration): Executable {
    // setup defaults
    exe.options.env = this.shallowCloneObject(process.env);
    exe.options.stdio = 'pipe';

    switch (process.platform) {
      case 'win32':
        break;
      default:
        exe.options.shell = true;
        break;
    }

    this.cleanEnvironmentPath(exe);

    // eslint-disable-next-line default-case
    switch (config.workspace.installType) {
      case PuppetInstallType.PDK:
        CommandEnvironmentHelper.buildPDKEnvironment(exe, config);
        break;
      case PuppetInstallType.PUPPET:
        CommandEnvironmentHelper.buildPuppetEnvironment(exe, config);
        break;
    }

    // undefined or null values still appear in the child spawn environment variables
    // In this case these elements should be removed from the Object
    this.removeEmptyElements(exe.options.env);

    return exe;
  }

  public static shallowCloneObject(value: Record<string, any>): Record<string, any> {
    const clone: Record<string, any> = {};
    for (const propertyName in value) {
      // eslint-disable-next-line no-prototype-builtins
      if (value.hasOwnProperty(propertyName)) {
        clone[propertyName] = value[propertyName];
      }
    }
    return clone;
  }

  public static removeEmptyElements(obj: Record<string, any>) {
    const propNames = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < propNames.length; i++) {
      const propName = propNames[i];
      if (obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
  }

  public static cleanEnvironmentPath(exe: Executable) {
    if (exe.options.env.PATH === undefined) {
      // It's possible that there is no PATH set but unlikely. Due to Object property names being
      // case sensitive it could simply be that it's called Path or path, particularly on Windows
      // not so much on Linux etc.. Look through all of the environment names looking for PATH in a
      // case insensitive way and remove the conflicting env var.
      let envPath = '';
      Object.keys(exe.options.env).forEach(function (keyname) {
        if (keyname.match(/^PATH$/i)) {
          envPath = exe.options.env[keyname];
          exe.options.env[keyname] = undefined;
        }
      });
      exe.options.env.PATH = envPath;
    }
    if (exe.options.env.RUBYLIB === undefined) {
      exe.options.env.RUBYLIB = '';
    }
  }

  private static buildExecutableCommand(config: IAggregateConfiguration) {
    let command = '';
    // eslint-disable-next-line default-case
    switch (config.workspace.installType) {
      case PuppetInstallType.PDK:
        command = path.join(config.ruby.pdkRubyDir, 'bin', 'ruby');
        break;
      case PuppetInstallType.PUPPET:
        command = 'ruby';
        break;
    }
    return command;
  }

  private static buildLanguageServerArguments(serverPath: string, settings: IAggregateConfiguration): string[] {
    const args = [serverPath];

    switch (settings.workspace.editorService.protocol) {
      case ProtocolType.STDIO:
        args.push('--stdio');
        break;
      case ProtocolType.TCP:
        if (
          settings.workspace.editorService.tcp.address === undefined ||
          settings.workspace.editorService.tcp.address === ''
        ) {
          args.push('--ip=127.0.0.1');
        } else {
          args.push('--ip=' + settings.workspace.editorService.tcp.address);
        }
        if (settings.workspace.editorService.tcp.port !== 0) {
          args.push('--port=' + settings.workspace.editorService.tcp.port);
        }
        break;
      default:
        break;
    }

    args.push('--timeout=' + settings.workspace.editorService.timeout);
    if (vscode.workspace.workspaceFolders !== undefined) {
      args.push('--local-workspace=' + vscode.workspace.workspaceFolders[0].uri.fsPath);
    }

    // Convert the individual puppet settings into the --puppet-settings
    // command line argument
    const puppetSettings: string[] = [];
    [
      { name: 'confdir', value: settings.workspace.editorService.puppet.confdir },
      { name: 'environment', value: settings.workspace.editorService.puppet.environment },
      { name: 'modulepath', value: settings.workspace.editorService.puppet.modulePath },
      { name: 'vardir', value: settings.workspace.editorService.puppet.vardir },
    ].forEach(function (item) {
      if (item.value !== undefined && item.value !== '') {
        puppetSettings.push('--' + item.name + ',' + item.value);
      }
    });
    if (puppetSettings.length > 0) {
      args.push('--puppet-settings=' + puppetSettings.join(','));
    }

    if (
      settings.workspace.editorService.puppet.version !== undefined &&
      settings.workspace.editorService.puppet.version.trim() !== ''
    ) {
      args.push('--puppet-version=' + settings.workspace.editorService.puppet.version.trim());
    }

    if (
      settings.workspace.editorService.debugFilePath !== undefined &&
      settings.workspace.editorService.debugFilePath !== ''
    ) {
      args.push('--debug=' + settings.workspace.editorService.debugFilePath);
    }
    return args;
  }

  private static buildDebugServerArguments(serverPath: string): string[] {
    const args = [serverPath];

    // The Debug Adapter always runs on TCP and IPv4 loopback
    // Using localhost can have issues due to ruby and node differing on what address
    // to use for localhost e.g Ruby may prefer 127.0.0.1 (IP4) and Node may prefer ::1 (IP6)
    // and therefore won't connect.
    args.push('--ip=127.0.0.1');

    // TODO: Add additional command line args e.g. --debuglogfie

    return args;
  }

  private static buildPuppetEnvironment(exe: Executable, config: IAggregateConfiguration) {
    exe.options.env.RUBYOPT = 'rubygems';
    exe.options.env.SSL_CERT_FILE = config.ruby.sslCertFile;
    exe.options.env.SSL_CERT_DIR = config.ruby.sslCertDir;
    exe.options.env.RUBY_DIR = config.ruby.rubydir;
    exe.options.env.PATH = this.buildPathArray([config.ruby.environmentPath, exe.options.env.PATH]);
    exe.options.env.RUBYLIB = this.buildPathArray([config.ruby.rubylib, exe.options.env.RUBYLIB]);
  }

  private static buildPDKEnvironment(exe: Executable, config: IAggregateConfiguration) {
    exe.options.env.RUBYOPT = 'rubygems';
    exe.options.env.DEVKIT_BASEDIR = config.ruby.puppetBaseDir;
    exe.options.env.RUBY_DIR = config.ruby.pdkRubyDir;
    exe.options.env.GEM_HOME = config.ruby.pdkGemDir;
    exe.options.env.GEM_PATH = this.buildPathArray([
      config.ruby.pdkGemVerDir,
      config.ruby.pdkGemDir,
      config.ruby.pdkRubyVerDir,
    ]);
    exe.options.env.RUBYLIB = this.buildPathArray([config.ruby.pdkRubyLib, exe.options.env.RUBYLIB]);
    exe.options.env.PATH = this.buildPathArray([
      config.ruby.pdkBinDir,
      config.ruby.pdkRubyBinDir,
      exe.options.env.PATH,
    ]);
  }

  private static buildPathArray(items: any[]) {
    return items.join(PathResolver.pathEnvSeparator());
  }
}
