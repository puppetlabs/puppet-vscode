import net = require('net');
import vscode = require('vscode');
import cp = require('child_process');
import { ILogger } from '../src/logging';
import { IConnectionConfiguration, ConnectionStatus, ConnectionType, ProtocolType } from './interfaces'
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient';
import { RubyHelper } from './rubyHelper';
import { PuppetStatusBar } from './PuppetStatusBar';
import { PuppetLanguageClient } from './PuppetLanguageClient';
import { ConnectionConfiguration } from './configuration';

const langID = 'puppet'; // don't change this

export interface IConnectionManager {
  status: ConnectionStatus;
  languageClient: LanguageClient;
  showLogger(): void;
  restartConnection(connectionConfig?: IConnectionConfiguration): void;
}

export class ConnectionManager implements IConnectionManager {
  private connectionStatus: ConnectionStatus;
  private statusBarItem: PuppetStatusBar;
  private logger: ILogger;
  private extensionContext: vscode.ExtensionContext;
  private connectionConfiguration: IConnectionConfiguration;
  private languageServerClient: LanguageClient;
  private languageServerProcess: cp.ChildProcess;
  private puppetLanguageClient: PuppetLanguageClient;

  constructor(
    context: vscode.ExtensionContext,
    logger: ILogger,
    statusBar: PuppetStatusBar,
    connectionConfiguration: IConnectionConfiguration
  ) {
    this.logger = logger;
    this.extensionContext = context;
    this.connectionStatus = ConnectionStatus.NotStarted;
    this.statusBarItem = statusBar;
    this.connectionConfiguration = connectionConfiguration;
  }

  public get status(): ConnectionStatus {
    return this.connectionStatus;
  }

  public set status(status: ConnectionStatus) {
    this.connectionStatus = status;
  }

  public get languageClient(): LanguageClient {
    return this.languageServerClient;
  }

  public start(connectionConfig: IConnectionConfiguration) {
    // Setup the configuration
    this.connectionConfiguration = connectionConfig;

    this.setConnectionStatus('Starting Puppet...', ConnectionStatus.Starting);

    if (this.connectionConfiguration.type === ConnectionType.Local) {
      this.createLanguageServerProcess(
        this.connectionConfiguration.languageServerPath,
        this.onLanguageServerStart.bind(this)
      );
    } else {
      this.languageServerClient = this.createLanguageClient();
      this.extensionContext.subscriptions.push(this.languageServerClient.start());
      this.logStart();
    }
  }

  public stop() {
    this.logger.debug('Stopping...');

    this.connectionStatus = ConnectionStatus.Stopping;

    // Close the language server client
    if (this.languageServerClient !== undefined) {
      this.languageServerClient.stop();
    }

    // The language server process we spawn will close once the
    // client disconnects.  No need to forcibly kill the process here. Also the language
    // client will try and send a shutdown event, which will throw errors if the language
    // client can no longer transmit the message.

    this.connectionStatus = ConnectionStatus.NotStarted;

    this.logger.debug('Stopped');
  }

  public dispose(): void {
    this.logger.debug('Disposing...');
    // Stop the current session
    this.stop();

    // Dispose of any subscriptions
    this.extensionContext.subscriptions.forEach(item => {
      item.dispose();
    });
  }

  public showLogger() {
    this.logger.show();
  }

  private logStart() {
    this.logger.debug('Congratulations, your extension "vscode-puppet" is now active!');
  }

  private onLanguageServerStart(proc: cp.ChildProcess) {
    this.logger.debug('LanguageServer Process Started: ' + proc.pid);
    this.languageServerProcess = proc;
    if (this.languageServerProcess === undefined) {
      if (this.connectionStatus === ConnectionStatus.Failed) {
        // We've already handled this state.  Just return
        return;
      }
      throw new Error('Unable to start the Language Server Process');
    }

    switch (this.connectionConfiguration.protocol) {
      case ProtocolType.TCP:
        this.languageServerProcess.stdout.on('data', data => {
          this.logger.debug('OUTPUT: ' + data.toString());

          // If the language client isn't already running and it's sent the trigger text, start up a client
          if (this.languageServerClient === undefined && data.toString().match('LANGUAGE SERVER RUNNING') !== null) {
            this.languageServerClient = this.createLanguageClient();
            this.extensionContext.subscriptions.push(this.languageServerClient.start());
          }
        });
        break;
      case ProtocolType.STDIO:
        this.logger.debug('Starting STDIO client: ');
        this.languageServerClient = this.createLanguageClient();
        this.extensionContext.subscriptions.push(this.languageServerClient.start());
        break;
    }

    this.languageServerProcess.on('close', exitCode => {
      this.logger.debug('SERVER terminated with exit code: ' + exitCode);
    });

    this.logStart();
  }

  public startLanguageServerProcess(cmd: string, args: Array<string>, options: cp.SpawnOptions, callback: Function) {
    let logPrefix: string = '[startLanguageServerProcess] ';
    var parsed = this.connectionConfiguration.languageServerCommandLine;
    args = args.concat(parsed);

    this.logger.debug(logPrefix + 'Starting the language server with ' + cmd + ' ' + args.join(' '));
    var proc = cp.spawn(cmd, args, options);
    this.logger.debug(logPrefix + 'Language server PID:' + proc.pid);

    callback(proc);
  }

  private createLanguageServerProcess(serverExe: string, callback: Function) {
    let logPrefix: string = '[createLanguageServerProcess] ';
    this.logger.debug(logPrefix + 'Language server found at: ' + serverExe);

    let localServer: {
      command: string;
      args: string[];
      options: cp.SpawnOptions;
    } = RubyHelper.getRubyEnvFromPuppetAgent(serverExe, this.connectionConfiguration, this.logger);
    // Commented out for the moment.  This will be enabled once the configuration and exact user story is figured out.
    //if (localServer == null) { localServer = RubyHelper.getRubyEnvFromPDK(serverExe, this.connectionConfiguration, this.logger); }

    if (localServer === null) {
      this.logger.warning(logPrefix + 'Could not find a valid Puppet Agent installation');
      this.setSessionFailure('Could not find a valid Puppet Agent installation');
      vscode.window.showWarningMessage(
        'Could not find a valid Puppet Agent installation. Functionality will be limited to syntax highlighting'
      );
      return;
    }

    let connMgr: ConnectionManager = this;
    if(this.connectionConfiguration.protocol === ProtocolType.TCP){
      if(this.connectionConfiguration.port){
        this.logger.debug(logPrefix + 'Selected port for local language server: ' + this.connectionConfiguration.port);
        connMgr.startLanguageServerProcess(localServer.command, localServer.args, localServer.options, callback);
      }else{
        // Start a server to get a random port
        this.logger.debug(logPrefix + 'Creating server process to identify random port');
        const server = net
          .createServer()
          .on('close', () => {
            this.logger.debug(logPrefix + 'Server process to identify random port disconnected');
            connMgr.startLanguageServerProcess(localServer.command, localServer.args, localServer.options, callback);
          })
          .on('error', err => {
            throw err;
          });

        // Listen on random port
        server.listen(0);
        this.logger.debug(logPrefix + 'Selected port for local language server: ' + server.address().port);
        connMgr.connectionConfiguration.port = server.address().port;
        server.close();
      }
    }else{
      this.logger.debug(logPrefix + 'STDIO Server process starting');
      connMgr.startLanguageServerProcess(localServer.command, localServer.args, localServer.options, callback);
    }
  }

  private STDIOServerOptions(serverProcess: cp.ChildProcess, logger:ILogger): ServerOptions {
    let serverOptions: ServerOptions = function() {
      return new Promise((resolve, reject) => {
        logger.debug(`[Puppet Lang Server Client] stdio connected`);
        resolve(serverProcess);
      });
    };
    return serverOptions;
  }

  private createTCPServerOptions(
    address: string,
    port: number,
    logger: ILogger,
    connectionManager: ConnectionManager
  ): ServerOptions {
    let serverOptions: ServerOptions = function() {
      return new Promise((resolve, reject) => {
        var client = new net.Socket();
        client.connect(port, address, function() {
          logger.error(`[Puppet Lang Server Client] tcp connected`);
          resolve({ reader: client, writer: client });
        });
        client.on('error', function(err) {
          logger.error(`[Puppet Lang Server Client] ` + err);
          connectionManager.setConnectionStatus(
            `Could not start language client: ${err.message}`,
            ConnectionStatus.Failed
          );
          return null;
        });
      });
    };
    return serverOptions;
  }

  private createLanguageClient(): LanguageClient {
    this.logger.debug('Configuring language server options');

    let serverOptions: ServerOptions;
    switch (this.connectionConfiguration.protocol) {
      case ProtocolType.STDIO:
      this.logger.debug(
        `Starting language server client (stdio)`
      );
        serverOptions = this.STDIOServerOptions(this.languageServerProcess, this.logger);
        break;
      case ProtocolType.TCP:
        serverOptions =  this.createTCPServerOptions(
          this.connectionConfiguration.host,
          this.connectionConfiguration.port,
          this.logger,
          this
        );
        this.logger.debug(
          `Starting language server client (host ${this.connectionConfiguration.host} port ${
            this.connectionConfiguration.port
          })`
        );
        break;
    }

    this.logger.debug('Configuring language server client options');
    let clientOptions: LanguageClientOptions = {
      documentSelector: [langID]
    };

    this.puppetLanguageClient = new PuppetLanguageClient(
      this.connectionConfiguration.host,
      this.connectionConfiguration.port,
      this,
      serverOptions,
      clientOptions,
      this.statusBarItem,
      this.logger
    );

    return this.puppetLanguageClient.languageServerClient;
  }

  public restartConnection(connectionConfig?: IConnectionConfiguration) {
    if (connectionConfig === undefined) {
      connectionConfig = new ConnectionConfiguration(this.extensionContext);
    }
    this.stop();
    this.start(connectionConfig);
  }

  private setConnectionStatus(statusText: string, status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusBarItem.setConnectionStatus(statusText, status);
  }

  private setSessionFailure(message: string, ...additionalMessages: string[]) {
    this.setConnectionStatus('Starting Error', ConnectionStatus.Failed);
  }
}
