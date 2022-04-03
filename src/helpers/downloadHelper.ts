import fs = require('fs');
import axiosBase, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import * as os from 'os';
import * as stream from 'stream';
import { promisify } from 'util';
import { ILogger } from '../logging';
import ProxyAgent = require('proxy-agent');

const finished = promisify(stream.finished);

export class DownloadHelper {
  private readonly client: AxiosInstance;
  private readonly tool: string;
  private readonly enableTelemetry: boolean;
  private readonly releaseBase: string;
  private readonly archiveName: string;
  private readonly destination: fs.PathLike;
  private readonly logger: ILogger;

  constructor(tool: string, enableTelemetry: boolean, logger: ILogger) {
    // TODO: Remove when pdkgo repo is renamed to pct
    let repo = tool;
    if (tool === 'pct') {
      repo = 'pdkgo';
    }
    this.logger = logger;
    this.tool = tool;
    this.enableTelemetry = enableTelemetry;
    this.releaseBase = `https://github.com/puppetlabs/${repo}/releases/latest/download`;
    this.archiveName = this.getArchiveName();
    this.destination = `${os.tmpdir()}/${this.archiveName}`;

    const proxyConfig = this.getProxyConfig();
    this.client = axiosBase.create({ ...proxyConfig });
  }

  private getArchiveName(): string {
    const arch = 'x86_64';
    const platform = os.platform();
    const ext = platform === 'win32' ? '.zip' : '.tar.gz';
    const pkgName = this.enableTelemetry ? this.tool : `notel_${this.tool}`;

    this.logger.debug(`Derrived package name '${pkgName}' from current platform.`);
    return `${pkgName}_${platform}_${arch}${ext}`;
  }

  private getProxyConfig(): AxiosRequestConfig {
    const httpProxy = process.env['HTTP_PROXY'] || process.env['http_proxy'];
    const httpsProxy = process.env['HTTPS_PROXY'] || process.env['https_proxy'];

    let config: AxiosRequestConfig = {};

    if (httpProxy || httpsProxy) {
      this.logger.debug(`Proxy settings detected!`);
      config = {
        proxy: false,
        httpAgent: httpProxy ? new ProxyAgent(httpProxy) : undefined,
        httpsAgent: httpsProxy ? new ProxyAgent(httpsProxy) : undefined,
      };
    }

    return config;
  }

  private async getRemoteChecksum(archive: string): Promise<string> {
    this.logger.debug(`Fetching checksum for ${archive}`);

    const response = await this.client.get(`${this.releaseBase}/checksums.txt`);

    const checksum = response.data
      .toString()
      .split('\n')
      .find((line: string) => line.includes(archive));

    if (!checksum) {
      throw new Error(`Could not find checksum for ${archive}`);
    }

    return checksum.split(' ')[0];
  }

  // Get the checksum of the file at the given path.
  private async getLocalChecksum(path: fs.PathLike): Promise<string> {
    this.logger.debug(`Calculating checksum for ${path}`);

    const buffer = await fs.promises.readFile(path);
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  public async install(): Promise<fs.PathLike> {
    const source = `${this.releaseBase}/${this.archiveName}`;

    this.logger.debug(`Downloading ${this.tool} from ${source}`);
    const response: AxiosResponse = await this.client.get(source, { responseType: 'stream' });
    const writeStream = fs.createWriteStream(this.destination);

    response.data.pipe(writeStream);
    await finished(writeStream);

    return this.destination;
  }

  public async verify(): Promise<void> {
    const remoteChecksum = await this.getRemoteChecksum(this.archiveName);
    const localChecksum = await this.getLocalChecksum(this.destination);
    if (remoteChecksum !== localChecksum) {
      throw new Error(`Checksum mismatch for ${this.tool}`);
    }
  }
}
