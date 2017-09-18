import net = require('net');
import path = require('path');
import vscode = require('vscode');
import cp = require('child_process');
import { Logger } from '../src/logging';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient';
import { ConnectionConfiguration } from './configuration';
import { setupPuppetCommands } from '../src/commands/puppetcommands';
import { setupPDKCommands } from '../src/commands/pdkcommands';
import { reporter } from './telemetry/telemetry';
import * as messages from '../src/messages';
import fs = require('fs');

const langID = 'puppet'; // don't change this

export enum ConnectionStatus {
  NotStarted,
  Starting,
  Running,
  Stopping,
  Failed
}

export enum ConnectionType {
  Unknown,
  Local,
  Remote
}

export interface IConnectionConfiguration {
  type: ConnectionType;
  host: string;
  port: number;
  timeout: number;
  preLoadPuppet: boolean;
  debugFilePath: string;
  puppetAgentDir: string;
}

export interface IConnectionManager {
  status: ConnectionStatus;
  languageClient: LanguageClient;
  showConnectionMenu();
}

export class ConnectionManager implements IConnectionManager {
  private connectionStatus: ConnectionStatus;
  private statusBarItem: vscode.StatusBarItem;
  private connectionConfiguration: IConnectionConfiguration;
  private languageServerClient: LanguageClient = undefined;
  private languageServerProcess = undefined;
  private extensionContext = undefined;
  private commandsRegistered = false;
  private logger: Logger = undefined;
  private terminal: vscode.Terminal = undefined

  public get status() : ConnectionStatus {
    return this.connectionStatus;
  }
  public get languageClient() : LanguageClient {
    return this.languageServerClient;
  }

  constructor(context: vscode.ExtensionContext, logger: Logger) {
    this.logger = logger;
    this.extensionContext = context;
  }

  public start(connectionConfig: IConnectionConfiguration) {
    // Setup the configuration
    this.connectionConfiguration = connectionConfig;
    this.connectionConfiguration.type = ConnectionType.Unknown;
    var contextPath = this.extensionContext.asAbsolutePath(path.join('vendor', 'languageserver', 'puppet-languageserver'));

    if (!this.commandsRegistered) {
      this.logger.debug('Configuring commands');

      setupPuppetCommands(langID, this, this.extensionContext, this.logger);

      this.terminal = vscode.window.createTerminal('Puppet PDK');
      this.terminal.processId.then(
        pid => {
          this.logger.debug("pdk shell started, pid: " + pid);
        });
      setupPDKCommands(langID, this, this.extensionContext, this.logger, this.terminal);
      this.extensionContext.subscriptions.push(this.terminal);

      this.commandsRegistered = true;
    }

    this.createStatusBarItem();

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

    if (this.connectionStatus === ConnectionStatus.Failed) {
      this.languageServerClient = undefined;
      this.languageServerProcess = undefined;
    }

    this.connectionStatus = ConnectionStatus.Stopping;

    // Close the language server client
    if (this.languageServerClient !== undefined) {
        this.languageServerClient.stop();
        this.languageServerClient = undefined;
    }

    // Kill the language server process we spawned
    if (this.languageServerProcess !== undefined) {
      // Terminate Language Server process
      // TODO: May not be functional on Windows.
      //       Perhaps send the exit command and wait for process to exit?
      this.languageServerProcess.kill();
      this.languageServerProcess = undefined;
    }

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
    args.push('--port=' + this.connectionConfiguration.port);
    args.push('--timeout=' + this.connectionConfiguration.timeout);
    if (this.connectionConfiguration.preLoadPuppet == false) { args.push('--no-preload'); }
    if ((this.connectionConfiguration.debugFilePath != undefined) && (this.connectionConfiguration.debugFilePath != '')) {
      args.push('--debug=' + this.connectionConfiguration.debugFilePath);
    }

    this.logger.debug("Starting the language server with " + cmd + " " + args.join(" "));
    var proc = cp.spawn(cmd, args, options)
    this.logger.debug('Language server PID:' + proc.pid)

    callback(proc);
  }

  private createLanguageServerProcess(serverExe: string, callback : Function) {
    this.logger.debug('Language server found at: ' + serverExe)

    let cmd: string = undefined;
    let args = [serverExe];
    let options : cp.SpawnOptions = {};

    // type Platform = 'aix'
    //               | 'android'
    //               | 'darwin'
    //               | 'freebsd'
    //               | 'linux'
    //               | 'openbsd'
    //               | 'sunos'
    //               | 'win32';
    switch (process.platform) {
      case 'win32':
        let comspec: string = process.env["COMSPEC"];
        let programFiles = process.env["ProgramFiles"];
        if (process.env["PROCESSOR_ARCHITEW6432"] == "AMD64") {
          // VSCode is running as 32bit process on a 64bit Operating System.  Need to break out
          // of the 32bit using the sysnative redirection and environment variables
          comspec = path.join(process.env["WINDIR"],"sysnative","cmd.exe");
          programFiles = process.env["ProgramW6432"];
        }
        let puppetDir: string = undefined;
        if (this.connectionConfiguration.puppetAgentDir == undefined) {
          puppetDir = path.join(programFiles, "Puppet Labs", "Puppet");
        } else {
          puppetDir = this.connectionConfiguration.puppetAgentDir;
        }
        let environmentBat : string = path.join(puppetDir,"bin","environment.bat")

        if (!fs.existsSync(puppetDir)) {
          this.setSessionFailure("Could not find Puppet Agent at " + puppetDir);
          vscode.window.showWarningMessage('Could not find Puppet Agent installed at "' + puppetDir + '". Functionality will be limited to syntax highlighting');
          return;
        }

        cmd = comspec;
        args = ['/K','CALL',environmentBat,'&&','ruby.exe',serverExe]
        options = {
          env: process.env,
          stdio: 'pipe',
        };
        break;
      default:
        this.logger.debug('Starting language server')

        let rubyPath: string = undefined;
        if (this.connectionConfiguration.puppetAgentDir == undefined) {
          rubyPath = '/opt/puppetlabs/puppet/bin/ruby';
        } else {
          rubyPath = path.join(this.connectionConfiguration.puppetAgentDir, "bin", "ruby");
        }
        if (fs.existsSync(rubyPath)) { cmd = rubyPath }

        // Default to ruby on the path
        if (cmd == undefined) { cmd = 'ruby' }
        options = {
          shell: true,
          env: process.env,
          stdio: 'pipe',
        };
    }

    if (cmd == undefined) {
      this.setSessionFailure("Unable to start the Language Server on this platform");
      vscode.window.showWarningMessage('The Puppet Language Server is not supported on this platform (' + process.platform + '). Functionality will be limited to syntax highlighting');
      return;
    }

    let connMgr : ConnectionManager = this;
    let logger = this.logger;
    // Start a server to get a random port
    this.logger.debug('Creating server process to identify random port')
    const server = net.createServer()
      .on('close', () => {
        logger.debug('Server process to identify random port disconnected');
        connMgr.startLanguageServerProcess(cmd, args, options, callback);
      })
      .on('error', (err) => {
        throw err;
      });

    // Listen on random port
    server.listen(0);
    this.logger.debug('Selected port for local language server: ' + server.address().port);
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
          connectionManager.setConnectionStatus(lastVersionResponse.puppetVersion, ConnectionStatus.Running);
          resolve();
        }

        connectionManager.languageClient.sendRequest(messages.PuppetVersionRequest.type).then((versionDetails) => {
          lastVersionResponse = versionDetails
          if (versionDetails.factsLoaded && versionDetails.functionsLoaded && versionDetails.typesLoaded) {
            clearInterval(handle);
            connectionManager.setConnectionStatus(lastVersionResponse.puppetVersion, ConnectionStatus.Running);
            resolve();
          } else {
            let progress = 0;

            if (versionDetails.factsLoaded) { progress++; }
            if (versionDetails.functionsLoaded) { progress++; }
            if (versionDetails.typesLoaded) { progress++; }
            progress = Math.round(progress / 3.0 * 100);

            this.setConnectionStatus("Loading Puppet (" + progress.toString() + "%)", ConnectionStatus.Starting);
          }
        });

      }, 1000);
    });
  }


  private restartConnection(connectionConfig?: IConnectionConfiguration) {
      this.stop();
      this.start(connectionConfig);
  }

  private createStatusBarItem() {
    if (this.statusBarItem === undefined) {
      this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);

      this.statusBarItem.command = messages.PuppetCommandStrings.PuppetShowConnectionMenuCommandId;
      this.statusBarItem.show();
      vscode.window.onDidChangeActiveTextEditor(textEditor => {
        if (textEditor === undefined || textEditor.document.languageId !== "puppet") {
          this.statusBarItem.hide();
        }
        else {
          this.statusBarItem.show();
        }
      })
    }
  }

  public showConnectionMenu() {
    var menuItems: ConnectionMenuItem[] = [];

    let currentConnectionConfig = this.connectionConfiguration;

    menuItems.push(
      new ConnectionMenuItem(
        "Restart Current Puppet Session",
        () => {
          let configuration = new ConnectionConfiguration(this.extensionContext);
          this.restartConnection(configuration);
        }),
    )

    menuItems.push(
      new ConnectionMenuItem(
        "Show Puppet Session Logs",
        () => { this.logger.show(); }),
    )

    vscode
      .window
      .showQuickPick<ConnectionMenuItem>(menuItems)
      .then((selectedItem) => { selectedItem.callback(); });
  }

  private setConnectionStatus(statusText: string, status: ConnectionStatus): void {
    // Set color and icon for 'Running' by default
    var statusIconText = "$(terminal) ";
    var statusColor = "#affc74";

    if (status == ConnectionStatus.Starting) {
      statusIconText = "$(sync) ";
      statusColor = "#f3fc74";
    }
    else if (status == ConnectionStatus.Failed) {
      statusIconText = "$(alert) ";
      statusColor = "#fcc174";
    }

    this.connectionStatus = status;
    this.statusBarItem.color = statusColor;
    this.statusBarItem.text = statusIconText + statusText;
  }

  private setSessionFailure(message: string, ...additionalMessages: string[]) {
    this.setConnectionStatus("Starting Error", ConnectionStatus.Failed);
  }
}

class ConnectionMenuItem implements vscode.QuickPickItem {
  public description: string;

  constructor(public readonly label: string, public readonly callback: () => void = () => { })
  {
  }
}
