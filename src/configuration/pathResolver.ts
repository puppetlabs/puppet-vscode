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

  public static pathEnvSeparator() {
    if (process.platform === 'win32') {
      return ';';
    } else {
      return ':';
    }
  }

}
