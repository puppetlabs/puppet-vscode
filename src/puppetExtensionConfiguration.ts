'use strict';

import path = require('path');
import * as vscode from 'vscode';
import { ConnectionType } from './interfaces';

export interface IPuppetExtensionConfiguration {
  type: ConnectionType;
  host: string;
  port: number;
  timeout: number;
  enableFileCache: boolean;
  debugFilePath: string;
  puppetAgentDir: string;
}

export class PuppetExtensionConfiguration {
  public langID: string = 'puppet'; // don't change this

  private config: vscode.WorkspaceConfiguration;

  constructor(config: vscode.WorkspaceConfiguration) {
    this.config = config;
  }

  public puppetAgentDir(): string {
    var puppetAgentDir = this.config['puppetAgentDir'];

    if (puppetAgentDir !== null) {
      return puppetAgentDir;
    }

    switch (process.platform) {
      case 'win32':
        let programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
        if (process.env['PROCESSOR_ARCHITEW6432'] === 'AMD64') {
          programFiles = process.env['ProgramW6432'] || 'C:\\Program Files';
        }
        puppetAgentDir = path.join(programFiles, 'Puppet Labs', 'Puppet'); // tslint:disable-line
        break;
      default:
        puppetAgentDir = '/opt/puppetlabs/puppet';
        break;
    }
    return puppetAgentDir;
  }

  public puppetDir() {
    return path.join(this.puppetAgentDir(), 'puppet');
  }

  public facterDir() {
    return path.join(this.puppetAgentDir(), 'facter');
  }

  public hieraDir() {
    return path.join(this.puppetAgentDir(), 'hiera');
  }

  public mcoDir() {
    return path.join(this.puppetAgentDir(), 'mcollective');
  }

  public rubydir() {
    return path.join(this.puppetAgentDir(), 'sys', 'ruby');
  }

  public rubylib() {
    let rubylib =
      path.join(this.puppetDir(), 'lib') + this.pathEnvSeparator() +
      path.join(this.facterDir(), 'lib') + this.pathEnvSeparator() +
      path.join(this.hieraDir(), 'lib') + this.pathEnvSeparator() +
      path.join(this.mcoDir(), 'lib');

    if (process.platform === 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      rubylib = rubylib.replace(/\\/g, '/');
    }
    return rubylib;
  }

  public debugFilePath(): string {
    return this.config['languageserver']['debugFilePath'];
  }

  public enableFileCache(): boolean {
    return this.config['languageserver']['filecache']['enable'];
  }

  public timeout(): number {
    return this.config['languageserver']['timeout'];
  }

  public host(): string {
    return this.config['languageserver']['address'];
  }

  public port(): number {
    return this.config['languageserver']['port'];
  }

  public type(): ConnectionType {
    if (this.host() === '127.0.0.1' ||
      this.host() === 'localhost' ||
      this.host() === '') {
      return ConnectionType.Local;
    } else {
      return ConnectionType.Remote;
    }
  }

  public languageServerArguments(){
    var args = new Array<string>();

    args.push('--port=' + this.port());
    args.push('--timeout=' + this.timeout());

    if ((this.host() === undefined) || (this.host() === '')) {
      args.push('--ip=127.0.0.1');
    } else {
      args.push('--ip=' + this.host());
    }

    if (vscode.workspace.workspaceFolders !== undefined) {
      args.push('--local-workspace=' + vscode.workspace.workspaceFolders[0].uri.fsPath);
    }

    if (this.enableFileCache()) {
      args.push('--enable-file-cache');
    }

    if ((this.debugFilePath() !== undefined) && (this.debugFilePath() !== '')) {
      args.push('--debug=' + this.debugFilePath());
    }

    return args;
  }

  private pathEnvSeparator() {
    if (process.platform === 'win32') {
      return ';';
    } else {
      return ':';
    }
  }
}
