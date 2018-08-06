'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { IConnectionConfiguration, ConnectionType, ProtocolType, PuppetInstallType } from './interfaces';

export class ConnectionConfiguration implements IConnectionConfiguration {
  public host: string;
  public port: number;
  public timeout: number;
  public enableFileCache: boolean;
  public debugFilePath: string;
  public langID: string = 'puppet'; // don't change this
  config: vscode.WorkspaceConfiguration;
  context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.config = vscode.workspace.getConfiguration('puppet');

    this.host = this.config['languageserver']['address'];
    this.port = this.config['languageserver']['port'];
    this.timeout = this.config['languageserver']['timeout'];
    this.enableFileCache = this.config['languageserver']['filecache']['enable'];
    this.debugFilePath = this.config['languageserver']['debugFilePath'];

    this._puppetInstallType = this.config['installType']
  }

  private _puppetInstallType : PuppetInstallType;
  public get puppetInstallType() : PuppetInstallType {
    return this._puppetInstallType;
  }
  public set puppetInstallType(v : PuppetInstallType) {
    this._puppetInstallType = v;
  }
  
  get puppetBaseDir(): string {
    if (this.config['installDirectory'] !== null) {
      return this.config['installDirectory'];
    }

    switch (process.platform) {
      case 'win32':
        let programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
        if (process.env['PROCESSOR_ARCHITEW6432'] === 'AMD64') {
          programFiles = process.env['ProgramW6432'] || 'C:\\Program Files';
        }
        // On Windows we have a subfolder called 'Puppet' that has
        // every product underneath
        return path.join(programFiles, 'Puppet Labs', 'Puppet');
      default:
        // On *nix we don't have a sub folder called 'Puppet'
        return '/opt/puppetlabs';
    }
  }

  get pdkDir(): string {
    if (this.config['pdkDir'] !== null) {
      return this.config['pdkDir'];
    }

    switch (process.platform) {
      case 'win32':
        let programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
        if (process.env['PROCESSOR_ARCHITEW6432'] === 'AMD64') {
          programFiles = process.env['ProgramW6432'] || 'C:\\Program Files';
        }
        return path.join(programFiles, 'Puppet Labs', 'DevelopmentKit');
      default:
        return '/opt/puppetlabs/pdk';
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
    switch(process.platform){
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
    ).join(this.pathEnvSeparator());

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
    ).join(this.pathEnvSeparator());
  }

  get languageServerPath(): string {
    return this.context.asAbsolutePath(path.join('vendor', 'languageserver', 'puppet-languageserver'));
  }

  get type(): ConnectionType {
    if (this.host === '127.0.0.1' || this.host === 'localhost' || this.host === '') {
      return ConnectionType.Local;
    } else {
      return ConnectionType.Remote;
    }
  }

  get protocol(): ProtocolType {
    switch (this.config['languageclient']['protocol']) {
      case 'stdio':
        return ProtocolType.STDIO;
      case 'tcp':
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

  pathEnvSeparator() {
    if (process.platform === 'win32') {
      return ';';
    } else {
      return ':';
    }
  }
}
