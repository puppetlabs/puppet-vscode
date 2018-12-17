import * as vscode from 'vscode';
import * as path from 'path';

import { ISettings } from '../settings';
import { Executable } from 'vscode-languageclient';
import { PuppetInstallType, ProtocolType, IConnectionConfiguration } from '../interfaces';
import { PathResolver } from '../configuration/pathResolver';

export class CommandEnvironmentHelper {
  public static getRubyEnvFromConfiguration(
    languageServerpath: string,
    settings: ISettings,
    config: IConnectionConfiguration,
  ): Executable {
    let exe: Executable = {
      command: this.buildExecutableCommand(settings, config),
      args: this.buildLanguageServerArguments(languageServerpath, settings),
      options: {},
    };

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

    switch (settings.installType) {
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

  private static buildExecutableCommand(settings: ISettings, config: IConnectionConfiguration) {
    let command: string = '';
    switch (settings.installType) {
      case PuppetInstallType.PDK:
        command = path.join(config.pdkRubyDir, 'bin', 'ruby');
        break;
      case PuppetInstallType.PUPPET:
        command = 'ruby';
        break;
    }
    return command;
  }

  private static buildLanguageServerArguments(
    serverPath: string,
    settings: ISettings,
  ): string[] {
    let args = [serverPath];

    switch (settings.editorService.protocol) {
      case ProtocolType.STDIO:
        args.push('--stdio');
        break;
      case ProtocolType.TCP:
        if (settings.editorService.tcp.address === undefined || settings.editorService.tcp.address === '') {
          args.push('--ip=127.0.0.1');
        } else {
          args.push('--ip=' + settings.editorService.tcp.address);
        }
        if (settings.editorService.tcp.port !== 0) {
          args.push('--port=' + settings.editorService.tcp.port);
        }
        break;
      default:
        break;
    }

    args.push('--timeout=' + settings.editorService.timeout);
    if (vscode.workspace.workspaceFolders !== undefined) {
      args.push('--local-workspace=' + vscode.workspace.workspaceFolders[0].uri.fsPath);
    }
    if (settings.editorService.modulePath !== undefined && settings.editorService.modulePath !== '') {
      args.push('--puppet-settings=--modulepath,' + settings.editorService.modulePath);
    }
    if (settings.editorService.debugFilePath !== undefined && settings.editorService.debugFilePath !== '') {
      args.push('--debug=' + settings.editorService.debugFilePath);
    }
    return args;
  }

  private static buildPuppetEnvironment(exe: Executable, config: IConnectionConfiguration) {
    exe.options.env.RUBYOPT = 'rubygems';
    exe.options.env.SSL_CERT_FILE = config.sslCertFile;
    exe.options.env.SSL_CERT_DIR = config.sslCertDir;
    exe.options.env.RUBY_DIR = config.rubydir;
    exe.options.env.PATH = this.buildPathArray([config.environmentPath, exe.options.env.PATH]);
    exe.options.env.RUBYLIB = this.buildPathArray([config.rubylib, exe.options.env.RUBYLIB]);
  }

  private static buildPDKEnvironment(exe: Executable, config: IConnectionConfiguration) {
    exe.options.env.RUBYOPT = 'rubygems';
    exe.options.env.DEVKIT_BASEDIR = config.puppetBaseDir;
    exe.options.env.RUBY_DIR = config.pdkRubyDir;
    exe.options.env.GEM_HOME = config.pdkGemDir;
    exe.options.env.GEM_PATH = this.buildPathArray([config.pdkGemVerDir, config.pdkGemDir, config.pdkRubyVerDir]);
    exe.options.env.RUBYLIB = this.buildPathArray([config.pdkRubyLib, exe.options.env.RUBYLIB]);
    exe.options.env.PATH = this.buildPathArray([config.pdkBinDir, config.pdkRubyBinDir, exe.options.env.PATH]);
  }

  private static buildPathArray(items: any[]) {
    return items.join(PathResolver.pathEnvSeparator());
  }

  private static shallowCloneObject(value: Object): Object {
    const clone: Object = {};
    for (const propertyName in value) {
      if (value.hasOwnProperty(propertyName)) {
        clone[propertyName] = value[propertyName];
      }
    }
    return clone;
  }

  private static removeEmptyElements(obj: Object) {
    const propNames = Object.getOwnPropertyNames(obj);
    for (var i = 0; i < propNames.length; i++) {
      const propName = propNames[i];
      if (obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
  }

  private static cleanEnvironmentPath(exe: Executable) {
    if (exe.options.env.PATH === undefined) {
      // It's possible that there is no PATH set but unlikely. Due to Object property names being
      // case sensitive it could simply be that it's called Path or path, particularly on Windows
      // not so much on Linux etc.. Look through all of the environment names looking for PATH in a
      // case insensitive way and remove the conflicting env var.
      let envPath: string = '';
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
}
