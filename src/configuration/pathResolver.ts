import * as path from 'path';
import * as fs from 'fs';

export class PathResolver {
  public static getprogramFiles(): string {
    switch (process.platform) {
      case 'win32':
        let programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';

        if (process.env['PROCESSOR_ARCHITEW6432'] === 'AMD64') {
          programFiles = process.env['ProgramW6432'] || 'C:\\Program Files';
        }
        return programFiles;

      default:
        return '/opt';
    }
  }

  public static resolveSubDirectory(rootDir: string, subDir: string) {
    var versionDir = path.join(rootDir, subDir);

    if (fs.existsSync(versionDir)) {
      return versionDir;
    } else {
      var subdir = PathResolver.getDirectories(rootDir)[1];
      return subdir;
    }
  }

  public static getDirectories(parent: string) {
    return fs.readdirSync(parent).filter(function (file) {
      return fs.statSync(path.join(parent, file)).isDirectory();
    });
  }

  public static pathEnvSeparator() {
    if (process.platform === 'win32') {
      return ';';
    } else {
      return ':';
    }
  }
}
