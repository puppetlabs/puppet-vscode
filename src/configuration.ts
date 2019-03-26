'use strict';

import * as path from 'path';
import * as fs from 'fs';

import { PathResolver } from './configuration/pathResolver';
import { ISettings, ConnectionType, ProtocolType, PuppetInstallType } from './settings';
import * as pdk from './configuration/pdkResolver';

/** Creates an Aggregate Configuration based on the VSCode Workspace settings (ISettings) */
export function CreateAggregrateConfiguration(settings:ISettings): IAggregateConfiguration {
  const value = new AggregateConfiguration(settings);

  return value;
}

/** The IRubyConfiguration describes all of the properties needed
 * to create a command to execute ruby.  For example a Language Server */
interface IRubyConfiguration {
  readonly puppetBaseDir: string;
  readonly puppetDir: string;
  readonly languageServerPath: string;
  readonly debugServerPath: string;
  readonly rubydir: string;
  readonly rubylib: string;
  readonly environmentPath: string;
  readonly sslCertFile: string;
  readonly sslCertDir: string;

  readonly pdkBinDir:string;
  readonly pdkRubyLib:string;
  readonly pdkRubyVerDir:string;
  readonly pdkGemDir:string;
  readonly pdkRubyDir:string;
  readonly pdkRubyBinDir:string;
  readonly pdkGemVerDir:string;
  readonly pdkPuppetVersions: string[];
}

/** The IConnectionConfiguration interface describes the connection used to
 * communicate with a Language Server.  In this case Puppet Editor Services
 */
interface IConnectionConfiguration {
  readonly type: ConnectionType;
  readonly protocol: ProtocolType;
}

/** This interface aggregates the workspace configuration
 * And then any derived settings from there. It is expected that these
 * settings are for the most part static, and only changed when the
 * underlying workspace settings change. */
export interface IAggregateConfiguration {
  readonly workspace: ISettings;
  readonly ruby: IRubyConfiguration;
  readonly connection: IConnectionConfiguration;
}

export class AggregateConfiguration implements IAggregateConfiguration {
  public workspace: ISettings;
  public ruby: IRubyConfiguration;
  public connection: IConnectionConfiguration;

  constructor(settings:ISettings) {
    this.workspace = settings;

    const puppetBaseDir = this.calculatePuppetBaseDir(settings);
    const puppetDir = this.safeJoin(puppetBaseDir, 'puppet');
    const facterDir = this.safeJoin(puppetBaseDir, 'facter');
    const rubyDir = this.calculateRubyDir(puppetBaseDir);

    let pdkInstance: pdk.IPDKRubyInstance = pdk.emptyPDKInstance();
    let puppetVersions: string[] = [];
    if (settings.installType === PuppetInstallType.PDK) {
      const pdkInfo = pdk.pdkInstances(puppetBaseDir);
      let result: pdk.IPDKRubyInstance;
      if (settings.editorService !== undefined && settings.editorService.puppet !== undefined && settings.editorService.puppet.version !== undefined) {
        result = pdkInfo.InstanceForPuppetVersion(settings.editorService.puppet.version);
      }
      // If we can't find the PDK instance from the puppet version or it wasn't defined, assume the latest.
      if (result === undefined) { result = pdkInfo.latest; }

      // An undefined instance means that either PDK isn't installed or that
      // the requested version doesn't exist.
      if (result !== undefined) { pdkInstance = result; }
      puppetVersions = pdkInfo.allPuppetVersions;
    }

    this.ruby = {
      puppetBaseDir: puppetBaseDir,
      puppetDir: puppetDir,
      languageServerPath: this.safeJoin('vendor', 'languageserver', 'puppet-languageserver'),
      debugServerPath: this.safeJoin('vendor', 'languageserver', 'puppet-debugserver'),
      rubydir: rubyDir,
      rubylib: this.calculateRubylib(puppetDir, facterDir),
      environmentPath: this.calculateEnvironmentPath(puppetDir, facterDir, puppetBaseDir, rubyDir),
      sslCertFile: this.safeJoin(puppetDir, 'ssl', 'cert.pem'),
      sslCertDir: this.safeJoin(puppetDir, 'ssl', 'certs'),
      pdkBinDir: this.safeJoin(puppetBaseDir, 'bin'),
      pdkRubyLib: this.replaceSlashes(this.safeJoin(puppetBaseDir, 'lib')),
      pdkRubyVerDir: pdkInstance.rubyVerDir,
      pdkGemDir: pdkInstance.gemDir,
      pdkRubyDir: pdkInstance.rubyDir,
      pdkRubyBinDir: pdkInstance.rubyBinDir,
      pdkGemVerDir: pdkInstance.gemVerDir,
      pdkPuppetVersions: puppetVersions,
    };

    this.connection = {
      type: this.calculateConnectionType(settings),
      protocol: (settings.editorService !== undefined && settings.editorService.protocol === ProtocolType.TCP) ? ProtocolType.TCP : ProtocolType.STDIO
    };
  }

  private safeJoin(...paths: string[]): string {
    let foundUndefined: Boolean = false;
    // path.join makes sure that no elements are 'undefined' and throws if there is. Instead
    // we can search for it and just return undefined ourself.
    paths.forEach( (item) => { foundUndefined = foundUndefined || (item === undefined); });
    if (foundUndefined) { return undefined; }
    return path.join(...paths);
  }

  private calculateConnectionType(settings:ISettings): ConnectionType {
    if (settings.editorService === undefined) { return undefined; }
    switch (settings.editorService.protocol) {
      case ProtocolType.TCP:
        if (settings.editorService.tcp.address === '127.0.0.1' ||
            settings.editorService.tcp.address === 'localhost' ||
            settings.editorService.tcp.address === '') {
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

  // PATH=%PUPPET_DIR%\bin;%FACTERDIR%\bin;%HIERA_DIR%\bin;%PL_BASEDIR%\bin;%RUBY_DIR%\bin;%PL_BASEDIR%\sys\tools\bin;%PATH%
  private calculateEnvironmentPath(
    puppetDir:string,
    facterDir:string,
    puppetBaseDir:string,
    rubydir:string
  ): string {
    return new Array(
      path.join(puppetDir, 'bin'),
      path.join(facterDir, 'bin'),
      // path.join(hieraDir, 'bin'),
      path.join(puppetBaseDir, 'bin'),
      path.join(rubydir, 'bin'),
      path.join(puppetBaseDir, 'sys', 'tools', 'bin')
    ).join(PathResolver.pathEnvSeparator());
  }

  // RUBYLIB=%PUPPET_DIR%\lib;%FACTERDIR%\lib;%HIERA_DIR%\lib;%RUBYLIB%
  private calculateRubylib(puppetDir:string, facterDir:string): string {
    return this.replaceSlashes(new Array(
      path.join(puppetDir, 'lib'),
      path.join(facterDir, 'lib'),
      // path.join(this.hieraDir, 'lib'),
    ).join(PathResolver.pathEnvSeparator()));
  }
  
  private calculateRubyDir(puppetBaseDir:string): string {
    switch (process.platform) {
      case 'win32':
        return path.join(puppetBaseDir, 'sys', 'ruby');
      default:
        return path.join(puppetBaseDir, 'lib', 'ruby');
    }
  }

  private calculatePuppetBaseDir(settings:ISettings): string {
    if ( (settings.installDirectory !== null) && (settings.installDirectory !== undefined) && (settings.installDirectory.trim() !== "") ) {
      return settings.installDirectory;
    }

    let programFiles = PathResolver.getprogramFiles();
    switch (settings.installType) {
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

  private findFirstDirectory(rootDir: string): string {
    if (!fs.existsSync(rootDir)) { return undefined; }
    var files = fs.readdirSync(rootDir);
    let result = files.sort( (a, b) => a.localeCompare(b, undefined, { numeric:true }) ).reverse()[0];
    return path.join(rootDir, result);
  }

  private replaceSlashes(path: string): string {
    if (path === undefined) { return path; }
    if (process.platform === 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      path = path.replace(/\\/g, '/');
    }
    return path;
  }
}
