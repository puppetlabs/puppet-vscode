'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { IConnectionConfiguration, ConnectionType, ProtocolType } from './interfaces';

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
  }

  get puppetAgentDir(): string {
    if (this.config['puppetAgentDir'] !== null) {
      return this.config['puppetAgentDir'];
    }

    switch (process.platform) {
      case 'win32':
        let programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
        if (process.env['PROCESSOR_ARCHITEW6432'] === 'AMD64') {
          programFiles = process.env['ProgramW6432'] || 'C:\\Program Files';
        }
        return path.join(programFiles, 'Puppet Labs', 'Puppet');
      default:
        return '/opt/puppetlabs/puppet';
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
    return path.join(this.puppetAgentDir, 'puppet');
  }

  get facterDir(): string {
    return path.join(this.puppetAgentDir, 'facter');
  }

  get hieraDir(): string {
    return path.join(this.puppetAgentDir, 'hiera');
  }

  get mcoDir(): string {
    return path.join(this.puppetAgentDir, 'mcollective');
  }

  get rubydir(): string {
    return path.join(this.puppetAgentDir, 'sys', 'ruby');
  }

  get rubylib(): string {
    var p =
      path.join(this.puppetDir, 'lib') +
      this.pathEnvSeparator() +
      path.join(this.facterDir, 'lib') +
      this.pathEnvSeparator() +
      path.join(this.hieraDir, 'lib') +
      this.pathEnvSeparator() +
      path.join(this.mcoDir, 'lib');

    if (process.platform === 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      p = p.replace(/\\/g, '/');
    }

    return p;
  }

  get sslCertDir(): string {
    return path.join(this.puppetDir, 'ssl', 'certs');
  }

  get sslCertFile(): string {
    return path.join(this.puppetDir, 'ssl', 'cert.pem');
  }

  get environmentPath(): string {
    return (
      path.join(this.puppetDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(this.facterDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(this.hieraDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(this.mcoDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(this.puppetAgentDir, 'bin') +
      this.pathEnvSeparator() +
      path.join(this.rubydir, 'bin') +
      this.pathEnvSeparator() +
      path.join(this.puppetAgentDir, 'sys', 'tools', 'bin') +
      this.pathEnvSeparator()
    );
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
