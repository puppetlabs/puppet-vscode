import * as fs from 'fs';
import * as path from 'path';

export interface IPDKRubyInstances {
  pdkDirectory: string;
  instances: IPDKRubyInstance[];
  latest: IPDKRubyInstance;
}

export interface IPDKRubyInstance {
  rubyVerDir: string;
  rubyDir: string;
  rubyBinDir: string;
  gemVerDir: string;
  gemDir: string;

  puppetVersions: string[];
  rubyVersion: string;
  valid: boolean;
}

// PDK Directory Layout
// *nix -    /opt/puppetlabs/pdk/
// Windows - C:\Program Files\Puppet Labs\DevelopmentKit
// | private
// |   | puppet
// |   |   | ruby
// |   |       | 2.5.0               <---- pdkRubyVerDir (GEM_PATH #3) (contains puppet gems e.g. puppet, ffi, gettext)
// |   | ruby
// |       | 2.5.1                   <---- pdkRubyDir
// |           | bin                 <---- pdkRubyBinDir
// |           | lib
// |               | ruby
// |                   | gems
// |                       | 2.5.0   <---- pdkGemVerDir (GEM_PATH #1) (contains base gem set e.g. bundler, rubygems)
// | share
//     | cache
//         | ruby
//             | 2.5.0               <---- pdkGemDir (GEM_PATH #2, replaceSlashes) (contains all the ancillary gems e.g. puppet-lint, rspec)

export function pdkInstances(pdkRootDirectory: string): IPDKRubyInstances {
  return new PDKRubyInstances(pdkRootDirectory);
}

export function emptyPDKInstance(): IPDKRubyInstance {
  return {
    'rubyVerDir': undefined,
    'rubyDir': undefined,
    'rubyBinDir': undefined,
    'gemVerDir': undefined,
    'gemDir': undefined,
    'puppetVersions': undefined,
    'rubyVersion': undefined,
    'valid': false
  };
}

class PDKRubyInstances implements IPDKRubyInstances {
  pdkDirectory: string;
  private rubyInstances: IPDKRubyInstance[] = undefined;

  constructor(
    pdkRootDirectory: string
  ) {
    this.pdkDirectory = pdkRootDirectory;
  }

  get instances(): IPDKRubyInstance[] {
    if (this.rubyInstances !== undefined) { return this.rubyInstances; }
    this.rubyInstances = new Array<IPDKRubyInstance>();
    if (this.pdkDirectory === undefined) { return this.rubyInstances; }
    if (!fs.existsSync(this.pdkDirectory)) { return this.rubyInstances; }

    var rubyDir = path.join(this.pdkDirectory, 'private', 'ruby');
    fs.readdirSync(rubyDir).forEach( (item) => {
      this.rubyInstances.push(new PDKRubyInstance(
        this.pdkDirectory,
        path.join(rubyDir, item)
      ));
    });

    return this.rubyInstances;
  }

  // Override toString to make it look pretty
  toString(): string {
    return "[" + 
    this.instances.map( (item) => {
      return item.toString();
    }).join(", ") + "]";
  }

  get latest(): IPDKRubyInstance {
    let result = undefined;
    let lastVersion = "0.0.0";

    this.instances.forEach( (instance) => {
      // We don't have a real semver module so treat the strings as numbers and sort.
      if (instance.rubyVersion.localeCompare(lastVersion,undefined, { numeric:true }) > 0) {
        result = instance;
        lastVersion = instance.rubyVersion;
      }
    });

    return result;
  }
}

class PDKRubyInstance implements IPDKRubyInstance {
  private _rubyVerDir: string;
  private _rubyDir: string;
  private _rubyBinDir: string;
  private _gemVerDir: string;
  private _gemDir: string;
  private _puppetVersions: string[];

  private _rubyVersion: string;
  private _valid: boolean = undefined;

  // Directory Paths
  get rubyVerDir():string { return this._rubyVerDir; }
  get rubyDir():string { return this._rubyDir; }
  get rubyBinDir():string { return this._rubyBinDir; }
  get gemVerDir():string { return this._gemVerDir; }
  get gemDir():string { return this._gemDir; }

  get rubyVersion():string { return this._rubyVersion; }

  get valid():boolean {
    if (this._valid !== undefined) { return this._valid; }
    // This instance is valid if these directories exist
    this._valid = fs.existsSync(this._rubyDir) &&
                  fs.existsSync(this._rubyBinDir) &&
                  fs.existsSync(this._rubyVerDir) &&
                  fs.existsSync(this._gemVerDir) &&
                  fs.existsSync(this._gemDir);
    return this._valid;
  }

  get puppetVersions():string[] {
    if (this._puppetVersions !== undefined) { return this._puppetVersions; }
    this._puppetVersions = [];
    let gemdir = path.join(this._rubyVerDir, 'gems');
    if (!fs.existsSync(gemdir)) { return this._puppetVersions; }

    // We could just call Ruby and ask it for all gems called puppet, but searching
    // the gem cache is just as easy and doesn't need to spawn a ruby process per
    // ruby version.
    fs.readdirSync(gemdir).forEach( (item) => {
      let pathMatch = item.match(/^puppet-(\d+\.\d+\.\d+)(?:(-|$))/);
      if (pathMatch !== null) { this._puppetVersions.push(pathMatch[1]); }
    });

    return this._puppetVersions;
  }

  // Override toString to make it look pretty
  toString(): string {
    return "{" +
    [`rubyVersion: \"${this._rubyVersion}\"`,
      `rubyDir: \"${this._rubyDir}\"`,
      `rubyVerDir: \"${this.rubyVerDir}\"`,
      `gemVerDir: \"${this.gemVerDir}\"`,
      `gemDir: \"${this.gemDir}\"`,
      `gemDir: \"${this.gemDir}\"`,
      `puppetVersions: \"${this.puppetVersions}\"`,
      `valid: \"${this.valid}\"`
    ].join(", ") +
    "}";
  }

  constructor(pdkDirectory: string, rubyDir:string) {
    this._rubyDir = rubyDir;
    this._rubyBinDir = path.join(rubyDir, 'bin');
    this._rubyVersion = path.basename(rubyDir);
    // This is a little naive however there doesn't appear to be a native semver module
    // loaded in VS Code. The gem path is always the <Major>.<Minor>.0 version of the
    // corresponding Ruby version
    let gemDirName = this._rubyVersion.replace(/\.\d+$/, '.0');
    // Calculate gem paths
    this._rubyVerDir = path.join(pdkDirectory, 'private', 'puppet', 'ruby', gemDirName);
    this._gemVerDir = path.join(this._rubyDir, 'lib', 'ruby', 'gems', gemDirName);
    this._gemDir = path.join(pdkDirectory, 'share', 'cache', 'ruby', gemDirName);
  }
}
