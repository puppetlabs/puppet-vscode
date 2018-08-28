'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { IConnectionConfiguration, ConnectionType, ProtocolType, PuppetInstallType } from './interfaces';
import { PathResolver } from './configuration/pathResolver';
import { ISettings, settingsFromWorkspace } from './settings';

export class ConnectionConfiguration implements IConnectionConfiguration {
  public host: string;
  public port: number;
  public timeout: number;
  public enableFileCache: boolean;
  public debugFilePath: string;
  private settings: ISettings;

  constructor() {
    this.settings = settingsFromWorkspace();

    this.host = this.settings.editorService.tcp.address;
    this.port = this.settings.editorService.tcp.port;
    this.timeout = this.settings.editorService.timeout;
    this.enableFileCache = (this.settings.editorService.featureflags.indexOf('filecache') !== -1);
    this.debugFilePath = this.settings.editorService.debugFilePath;

    this._puppetInstallType = this.settings.installType;
  }

  private _puppetInstallType: PuppetInstallType;
  public get puppetInstallType(): PuppetInstallType {
    return this._puppetInstallType;
  }
  public set puppetInstallType(v: PuppetInstallType) {
    this._puppetInstallType = v;
  }

  get puppetBaseDir(): string {
    if ( (this.settings.puppetAgentDir !== null) && (this.settings.puppetAgentDir !== undefined) && (this.settings.puppetAgentDir.trim() !== "") ) {
      return this.settings.puppetAgentDir;
    }

    let programFiles = PathResolver.getprogramFiles();
    switch (this.puppetInstallType) {
      case PuppetInstallType.PDK:
        switch (process.platform) {
          case 'win32':
            return path.join(programFiles, 'Puppet Labs', 'DevelopmentKit');
          default:
            return path.join(programFiles, 'puppetlabs', 'pdk');
        }
      case PuppetInstallType.PUPPET:
        switch (process.platform) {
          case 'win32':
            // On Windows we have a subfolder called 'Puppet' that has 
            // every product underneath 
            return path.join(programFiles, 'Puppet Labs', 'Puppet');
          default:
            // On *nix we don't have a sub folder called 'Puppet' 
            return path.join(programFiles, 'puppetlabs');
        }
      default:
        switch (process.platform) {
          case 'win32':
            return path.join(programFiles, 'Puppet Labs', 'DevelopmentKit');
          default:
            return path.join(programFiles, 'puppetlabs', 'pdk');
        }
    }
  }

  get puppetDir(): string {
    return path.join(this.puppetBaseDir, 'puppet');
  }

  get facterDir(): string {
    return path.join(this.puppetBaseDir, 'facter');
  }

  get hieraDir(): string {
    return path.join(this.puppetBaseDir, 'hiera');
  }

  get mcoDir(): string {
    return path.join(this.puppetBaseDir, 'mcollective');
  }

  get rubydir(): string {
    switch (process.platform) {
      case 'win32':
        return path.join(this.puppetBaseDir, 'sys', 'ruby');
      default:
        return path.join(this.puppetBaseDir, 'lib', 'ruby');
    }
  }

  get sslCertDir(): string {
    return path.join(this.puppetDir, 'ssl', 'certs');
  }

  get sslCertFile(): string {
    return path.join(this.puppetDir, 'ssl', 'cert.pem');
  }

  // RUBYLIB=%PUPPET_DIR%\lib;%FACTERDIR%\lib;%HIERA_DIR%\lib;%RUBYLIB%
  get rubylib(): string {
    var p = new Array(
      path.join(this.puppetDir, 'lib'),
      path.join(this.facterDir, 'lib'),
      // path.join(this.hieraDir, 'lib'),
    ).join(PathResolver.pathEnvSeparator());

    if (process.platform === 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      p = p.replace(/\\/g, '/');
    }

    return p;
  }

  // PATH=%PUPPET_DIR%\bin;%FACTERDIR%\bin;%HIERA_DIR%\bin;%PL_BASEDIR%\bin;%RUBY_DIR%\bin;%PL_BASEDIR%\sys\tools\bin;%PATH%
  get environmentPath(): string {
    return new Array(
      path.join(this.puppetDir, 'bin'),
      path.join(this.facterDir, 'bin'),
      // path.join(this.hieraDir, 'bin'),
      path.join(this.puppetBaseDir, 'bin'),
      path.join(this.rubydir, 'bin'),
      path.join(this.puppetBaseDir, 'sys', 'tools', 'bin')
    ).join(PathResolver.pathEnvSeparator());
  }

  get languageServerPath(): string {
    return path.join('vendor', 'languageserver', 'puppet-languageserver');
  }

  get type(): ConnectionType {
    switch (this.settings.editorService.protocol) {
      case ProtocolType.TCP:
        if (this.host === '127.0.0.1' || this.host === 'localhost' || this.host === '') {
          return ConnectionType.Local;
        } else {
          return ConnectionType.Remote;
        }
      case ProtocolType.STDIO:
        // STDIO can only ever be local
        return ConnectionType.Local;
      default:
        // In this case we have no idea what the type is
        return undefined;
    }
  }

  get protocol(): ProtocolType {
    switch (this.settings.editorService.protocol) {
      case ProtocolType.TCP:
        return ProtocolType.TCP;
      default:
        return ProtocolType.STDIO;
    }
  }

  get languageServerCommandLine(): Array<string> {
    var args = new Array<string>();

    switch (this.protocol) {
      case ProtocolType.STDIO:
        args.push('--stdio');
        break;
      case ProtocolType.TCP:
        if (this.host === undefined || this.host === '') {
          args.push('--ip=127.0.0.1');
        } else {
          args.push('--ip=' + this.host);
        }
        if (this.port !== 0) {
          args.push('--port=' + this.port);
        }
        break;
      default:
        break;
    }

    args.push('--timeout=' + this.timeout);

    if (vscode.workspace.workspaceFolders !== undefined) {
      args.push('--local-workspace=' + vscode.workspace.workspaceFolders[0].uri.fsPath);
    }

    if (this.enableFileCache) {
      args.push('--enable-file-cache');
    }

    if (this.debugFilePath !== undefined && this.debugFilePath !== '') {
      args.push('--debug=' + this.debugFilePath);
    }

    return args;
  }

  get pdkBinDir(): string {
    return path.join(this.puppetBaseDir, 'bin');
  }

  get pdkRubyLib(): string {
    var lib = path.join(this.puppetBaseDir, 'lib');
    if (process.platform === 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      lib = lib.replace(/\\/g, '/');
    }
    return lib;
  }

  get pdkRubyVerDir(): string {
    var rootDir = path.join(this.puppetBaseDir, 'private', 'puppet', 'ruby');
    var versionDir = '2.4.0';

    return PathResolver.resolveSubDirectory(rootDir, versionDir);
  }

  get pdkGemDir(): string {
    // GEM_HOME=C:\Users\user\AppData\Local/PDK/cache/ruby/2.4.0
    var rootDir = path.join(this.puppetBaseDir, 'share', 'cache', 'ruby');
    var versionDir = '2.4.0';
    var directory = PathResolver.resolveSubDirectory(rootDir, versionDir);

    if (process.platform === 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      directory = directory.replace(/\\/g, '/');
    }
    return directory;
  }

  get pdkRubyDir(): string {
    var rootDir = path.join(this.puppetBaseDir, 'private', 'ruby');
    var versionDir = '2.4.4';

    return PathResolver.resolveSubDirectory(rootDir, versionDir);
  }

  get pdkRubyBinDir(): string {
    return path.join(this.pdkRubyDir, 'bin');
  }

  get pdkGemVerDir(): string {
    var rootDir = path.join(this.pdkRubyDir, 'lib', 'ruby', 'gems');
    var versionDir = '2.4.0';

    return PathResolver.resolveSubDirectory(rootDir, versionDir);
  }

  // GEM_PATH=C:/Program Files/Puppet Labs/DevelopmentKit/private/ruby/2.4.4/lib/ruby/gems/2.4.0;C:/Program Files/Puppet Labs/DevelopmentKit/share/cache/ruby/2.4.0;C:/Program Files/Puppet Labs/DevelopmentKit/private/puppet/ruby/2.4.0

}
