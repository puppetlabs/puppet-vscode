import net = require('net');
import path = require('path');
import vscode = require('vscode');
import cp = require('child_process');
import { ILogger } from '../src/logging';
import { IConnectionConfiguration, ConnectionStatus, ConnectionType } from './interfaces'
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient';
import { ConnectionConfiguration } from './configuration';
import { reporter } from './telemetry/telemetry';
import * as messages from '../src/messages';
import fs = require('fs');
import { RubyHelper } from './rubyHelper';
import { PuppetStatusBar } from './PuppetStatusBar';
import { PuppetConnectionMenuItem } from './PuppetConnectionMenuItem';

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
  private languageServerProcess;
  private extensionContext;
  private logger: ILogger;

  public get status() : ConnectionStatus {
    return this.connectionStatus;
  }
  public get languageClient() : LanguageClient {
    return this.languageServerClient;
  }
  public showLogger() {
    this.logger.show()
  }

  constructor(context: vscode.ExtensionContext, logger: ILogger, statusBar: PuppetStatusBar) {
    this.logger = logger;
    this.extensionContext = context;
    this.connectionStatus = ConnectionStatus.NotStarted;
    this.statusBarItem = statusBar;
  }

  public start(connectionConfig: IConnectionConfiguration) {
    // Setup the configuration
    this.connectionConfiguration = connectionConfig;
    this.connectionConfiguration.type = ConnectionType.Unknown;
    var contextPath = this.extensionContext.asAbsolutePath(path.join('vendor', 'languageserver', 'puppet-languageserver'));

    if (this.connectionConfiguration.host == '127.0.0.1' ||
        this.connectionConfiguration.host == 'localhost' ||
        this.connectionConfiguration.host == '') {
      this.connectionConfiguration.type = ConnectionType.Local
    } else {
      this.connectionConfiguration.type = ConnectionType.Remote
    }

    this.languageServerClient = undefined
    this.languageServerProcess = undefined
    this.setConnectionStatus("Starting Puppet...", ConnectionStatus.Starting);

    if (this.connectionConfiguration.type == ConnectionType.Local) {
      this.createLanguageServerProcess(contextPath, this.onLanguageServerStart.bind(this));
    }
    else {
      this.languageServerClient = this.startLangClientTCP();
      this.extensionContext.subscriptions.push(this.languageServerClient.start());
      this.logStart();
    }
  }

  public stop() {
    this.logger.debug('Stopping...')

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

  public dispose() : void {
    this.logger.debug('Disposing...');
    // Stop the current session
    this.stop();

    // Dispose of any subscriptions
    this.extensionContext.subscriptions.forEach(item => { item.dispose(); });
    this.extensionContext.subscriptions.clear();
  }

  private logStart() {
    this.logger.debug('Congratulations, your extension "vscode-puppet" is now active!');
  }

  private onLanguageServerStart(proc : cp.ChildProcess) {
    this.logger.debug('LanguageServer Process Started: ' + proc)
    this.languageServerProcess = proc
    if (this.languageServerProcess == undefined) {
        if (this.connectionStatus == ConnectionStatus.Failed) {
          // We've already handled this state.  Just return
          return
        }
        throw new Error('Unable to start the Language Server Process');
      }

      this.languageServerProcess.stdout.on('data', (data) => {
        this.logger.debug("OUTPUT: " + data.toString());

        // If the language client isn't already running and it's sent the trigger text, start up a client
        if ( (this.languageServerClient == undefined) && (data.toString().match("LANGUAGE SERVER RUNNING") != null) ) {
          this.languageServerClient = this.startLangClientTCP();
          this.extensionContext.subscriptions.push(this.languageServerClient.start());
        }
      });

      this.languageServerProcess.on('close', (exitCode) => {
        this.logger.debug("SERVER terminated with exit code: " + exitCode);
      });

      this.logStart();
  }

  public startLanguageServerProcess(cmd : string, args : Array<string>, options : cp.SpawnOptions, callback : Function) {
    if ((this.connectionConfiguration.host == undefined) || (this.connectionConfiguration.host == '')) {
      args.push('--ip=127.0.0.1');
    } else {
      args.push('--ip=' + this.connectionConfiguration.host);
    }
    if (vscode.workspace.workspaceFolders != undefined) {
      args.push('--local-workspace=' + vscode.workspace.workspaceFolders[0].uri.fsPath);
    }
    args.push('--port=' + this.connectionConfiguration.port);
    args.push('--timeout=' + this.connectionConfiguration.timeout);
    if (this.connectionConfiguration.enableFileCache) {
      args.push('--enable-file-cache');
    }
    if ((this.connectionConfiguration.debugFilePath != undefined) && (this.connectionConfiguration.debugFilePath != '')) {
      args.push('--debug=' + this.connectionConfiguration.debugFilePath);
    }

    this.logger.debug("Starting the language server with " + cmd + " " + args.join(" "));
    var proc = cp.spawn(cmd, args, options)
    this.logger.debug('Language server PID:' + proc.pid)

    callback(proc);
  }

  private createLanguageServerProcess(serverExe: string, callback : Function) {
    let logPrefix: string = '[createLanguageServerProcess] ';
    this.logger.debug(logPrefix + 'Language server found at: ' + serverExe)

    let localServer = null

    if (localServer == null) { localServer = RubyHelper.getRubyEnvFromPuppetAgent(serverExe, this.connectionConfiguration, this.logger); }
    // Commented out for the moment.  This will be enabled once the configuration and exact user story is figured out.
    //if (localServer == null) { localServer = RubyHelper.getRubyEnvFromPDK(serverExe, this.connectionConfiguration, this.logger); }

    if (localServer == null) {
      this.logger.warning(logPrefix + "Could not find a valid Puppet Agent installation");
      this.setSessionFailure("Could not find a valid Puppet Agent installation");
      vscode.window.showWarningMessage('Could not find a valid Puppet Agent installation. Functionality will be limited to syntax highlighting');
      return;
    }

    let connMgr : ConnectionManager = this;
    let logger = this.logger;
    // Start a server to get a random port
    this.logger.debug(logPrefix + 'Creating server process to identify random port')
    const server = net.createServer()
      .on('close', () => {
        logger.debug(logPrefix + 'Server process to identify random port disconnected');
        connMgr.startLanguageServerProcess(localServer.command, localServer.args, localServer.options, callback);
      })
      .on('error', (err) => {
        throw err;
      });

    // Listen on random port
    server.listen(0);
    this.logger.debug(logPrefix + 'Selected port for local language server: ' + server.address().port);
    connMgr.connectionConfiguration.port = server.address().port;
    server.close();
  }

  private startLangClientTCP(): LanguageClient {
    this.logger.debug('Configuring language server options')
    let langClient = this;

    let connMgr:ConnectionManager = this;
    let serverOptions: ServerOptions = function () {
      return new Promise((resolve, reject) => {
        var client = new net.Socket();
        client.connect(connMgr.connectionConfiguration.port, connMgr.connectionConfiguration.host, function () {
          resolve({ reader: client, writer: client });
        });
        client.on('error', function (err) {
          langClient.logger.error(`[Puppet Lang Server Client] ` + err);
          connMgr.setSessionFailure("Could not start language client: ", err.message);

          return null;
        })
      });
    }

    this.logger.debug('Configuring language server client options')
    let clientOptions: LanguageClientOptions = {
      documentSelector: [langID],
    }

    this.logger.debug(`Starting language server client (host ${this.connectionConfiguration.host} port ${this.connectionConfiguration.port})`)

    var title = `tcp lang server (host ${this.connectionConfiguration.host} port ${this.connectionConfiguration.port})`;
    var languageServerClient = new LanguageClient(title, serverOptions, clientOptions)
    languageServerClient.onReady().then(() => {
      langClient.logger.debug('Language server client started, setting puppet version')
      this.setConnectionStatus("Loading Puppet", ConnectionStatus.Starting);
      this.queryLanguageServerStatus();
      // Send telemetry
      if (reporter) {
        languageServerClient.sendRequest(messages.PuppetVersionRequest.type).then((versionDetails) => {
          reporter.sendTelemetryEvent('puppetVersion' +versionDetails.puppetVersion);
          reporter.sendTelemetryEvent('facterVersion' + versionDetails.facterVersion);
          reporter.sendTelemetryEvent('languageServerVersion' + versionDetails.languageServerVersion);
          reporter.sendTelemetryEvent('version', {
            puppetVersion: versionDetails.puppetVersion,
            facterVersion: versionDetails.facterVersion,
            languageServerVersion: versionDetails.languageServerVersion,
          });
        });
      }
    }, (reason) => {
      this.setSessionFailure("Could not start language service: ", reason);
    });

    return languageServerClient;
  }

  private queryLanguageServerStatus() {
    let connectionManager = this;

    return new Promise((resolve, reject) => {
      let count = 0;
      let lastVersionResponse = null;
      let handle = setInterval(() => {
        count++;

        // After 30 seonds timeout the progress
        if (count >= 30 || connectionManager.languageClient == undefined) {
          clearInterval(handle);
          this.setConnectionStatus(lastVersionResponse.puppetVersion, ConnectionStatus.Running);
          resolve();
          return;
        }

        connectionManager.languageClient.sendRequest(messages.PuppetVersionRequest.type).then((versionDetails) => {
          lastVersionResponse = versionDetails
          if (versionDetails.factsLoaded &&
              versionDetails.functionsLoaded &&
              versionDetails.typesLoaded &&
              versionDetails.classesLoaded) {
            clearInterval(handle);
            this.setConnectionStatus(lastVersionResponse.puppetVersion, ConnectionStatus.Running);
            resolve();
          } else {
            let progress = 0;

            if (versionDetails.factsLoaded) { progress++; }
            if (versionDetails.functionsLoaded) { progress++; }
            if (versionDetails.typesLoaded) { progress++; }
            if (versionDetails.classesLoaded) { progress++; }
            progress = Math.round(progress / 4.0 * 100);

            this.setConnectionStatus("Loading Puppet (" + progress.toString() + "%)", ConnectionStatus.Starting);
          }
        });

      }, 1000);
    });
  }

  public restartConnection(connectionConfig?: IConnectionConfiguration) {
    if (connectionConfig == undefined) {
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
    this.setConnectionStatus("Starting Error", ConnectionStatus.Failed);
  }
}
