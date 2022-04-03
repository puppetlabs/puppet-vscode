import * as admZip from 'adm-zip';
import * as fs from 'fs';
import { platform } from 'os';
import * as tar from 'tar-fs';
import * as zlib from 'zlib';

export class ArchiveHelper {
  public static async expandArchive(source: fs.PathLike, destination: fs.PathLike): Promise<void> {
    switch (platform()) {
      case 'win32':
        await this.expandZip(source, destination);
        break;
      case 'darwin' || 'linux':
        await this.expandTarGz(source, destination);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform()}`);
    }
  }

  private static async expandTarGz(source: fs.PathLike, destination: fs.PathLike): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.createReadStream(source)
        .on('error', reject)
        .pipe(zlib.createGunzip())
        .on('error', reject)
        .pipe(tar.extract(destination.toString()))
        .on('error', reject)
        .on('finish', resolve);
    });
  }

  private static async expandZip(source: fs.PathLike, destination: fs.PathLike): Promise<void> {
    const zip = new admZip(source.toString());
    zip.extractAllTo(destination.toString(), true);
  }
}
