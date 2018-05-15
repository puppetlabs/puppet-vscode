import net = require('net');
import path = require('path');
import vscode = require('vscode');
import cp = require('child_process');
import { ILogger } from '../src/logging';
import { ConnectionStatus, ConnectionType } from './interfaces';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient';
import { ConnectionConfiguration, IConnectionConfiguration } from './configuration';
import { reporter } from './telemetry/telemetry';
import * as messages from '../src/messages';
import fs = require('fs');
import { RubyHelper } from './rubyHelper';
import { PuppetStatusBar } from './PuppetStatusBar';
import { PuppetConnectionMenuItem } from './PuppetConnectionMenuItem';
import { PuppetVersionDetails } from '../src/messages';
import { PuppetLanguageClient } from './PuppetLanguageClient';

const langID = 'puppet'; // don't change this

export interface IConnectionManager {
  status: ConnectionStatus;
  languageClient: LanguageClient;
  showLogger();
  restartConnection(connectionConfig?: IConnectionConfiguration);
}

export class ConnectionManager implements IConnectionManager {
  private connectionStatus: ConnectionStatus;
  private statusBarItem: PuppetStatusBar;
  private connectionConfiguration: IConnectionConfiguration;
  private languageServerClient: LanguageClient;
  private languageServerProcess: cp.ChildProcess;
  private extensionContext: vscode.ExtensionContext;
  private logger: ILogger;
  private puppetLanguageClient: PuppetLanguageClient;

  constructor(context: vscode.ExtensionContext, logger: ILogger, statusBar: PuppetStatusBar) {
    this.logger = logger;
    this.extensionContext = context;
    this.connectionStatus = ConnectionStatus.NotStarted;
    this.statusBarItem = statusBar;
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
      this.languageServerClient = this.startLangClientTCP();
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
      this.languageServerClient = undefined;
    }

    // The language server process we spawn will close once the
    // client disconnects.  No need to forcibly kill the process here. Also the language
    // client will try and send a shutdown event, which will throw errors if the language
    // client can no longer transmit the message.
    this.languageServerProcess = undefined;

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
    this.extensionContext.subscriptions.clear();
  }

  public showLogger() {
    this.logger.show();
  }

  private logStart() {
    this.logger.debug('Congratulations, your extension "vscode-puppet" is now active!');
  }

  private onLanguageServerStart(proc: cp.ChildProcess) {
    this.logger.debug('LanguageServer Process Started: ' + proc);
    this.languageServerProcess = proc;
    if (this.languageServerProcess === undefined) {
      if (this.connectionStatus === ConnectionStatus.Failed) {
        // We've already handled this state.  Just return
        return;
      }
      throw new Error('Unable to start the Language Server Process');
    }

    this.languageServerProcess.stdout.on('data', data => {
      this.logger.debug('OUTPUT: ' + data.toString());

      // If the language client isn't already running and it's sent the trigger text, start up a client
      if (this.languageServerClient === undefined && data.toString().match('LANGUAGE SERVER RUNNING') !== null) {
        this.languageServerClient = this.startLangClientTCP();
        this.extensionContext.subscriptions.push(this.languageServerClient.start());
      }
    });

    this.languageServerProcess.on('close', exitCode => {
      this.logger.debug('SERVER terminated with exit code: ' + exitCode);
    });

    this.logStart();
  }

  public startLanguageServerProcess(cmd: string, args: Array<string>, options: cp.SpawnOptions, callback: Function) {
    var parsed = this.connectionConfiguration.languageServerCommandLine;
    args = args.concat(parsed);

    this.logger.debug('Starting the language server with ' + cmd + ' ' + args.join(' '));
    var proc = cp.spawn(cmd, args, options);
    this.logger.debug('Language server PID:' + proc.pid);

    callback(proc);
  }

  private createLanguageServerProcess(serverExe: string, callback: Function) {
    let logPrefix: string = '[createLanguageServerProcess] ';
    this.logger.debug(logPrefix + 'Language server found at: ' + serverExe);

    let localServer: {
      command: string;
      args: string[];
      options: cp.SpawnOptions;
    } | null = RubyHelper.getRubyEnvFromPuppetAgent(serverExe, this.connectionConfiguration, this.logger);
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
    let logger = this.logger;
    // Start a server to get a random port
    this.logger.debug(logPrefix + 'Creating server process to identify random port');
    const server = net
      .createServer()
      .on('close', () => {
        logger.debug(logPrefix + 'Server process to identify random port disconnected');
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

  private startLangClientTCP(): LanguageClient {
    this.logger.debug('Configuring language server options');
    let langClient = this;

    let connMgr: ConnectionManager = this;
    let serverOptions: ServerOptions = function() {
      return new Promise((resolve, reject) => {
        var client = new net.Socket();
        client.connect(connMgr.connectionConfiguration.port, connMgr.connectionConfiguration.host, function() {
          resolve({ reader: client, writer: client });
        });
        client.on('error', function(err) {
          langClient.logger.error(`[Puppet Lang Server Client] ` + err);
          connMgr.setSessionFailure('Could not start language client: ', err.message);

          return null;
        });
      });
    };

    this.logger.debug('Configuring language server client options');
    let clientOptions: LanguageClientOptions = {
      documentSelector: [langID]
    };

    this.logger.debug(
      `Starting language server client (host ${this.connectionConfiguration.host} port ${
        this.connectionConfiguration.port
      })`
    );

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
