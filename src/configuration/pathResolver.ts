import * as fs from 'fs';
import * as path from 'path';

export class PathResolver {
  public static getprogramFiles(): string {
    switch (process.platform) {
      case 'win32':
        // eslint-disable-next-line no-case-declarations
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
    const versionDir = path.join(rootDir, subDir);

    if (fs.existsSync(versionDir)) {
      return versionDir;
    } else {
      const subdir = PathResolver.getDirectories(rootDir)[1];
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
