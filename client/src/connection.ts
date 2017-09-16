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
  showLogger();
  restartConnection(connectionConfig?: IConnectionConfiguration);
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
  public showLogger() {
    this.logger.show()
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

  private getDirectories(parent) {
    return fs.readdirSync(parent).filter(function (file) {
      return fs.statSync(path.join(parent, file)).isDirectory();
    });
  }

  private pathEnvSeparator() {
    if (process.platform == 'win32') {
      return ";";
    } else {
      return ":";
    }
  }

  private getLanguageServerFromPuppetAgent(serverExe) {
    let logPrefix: string = '[getLanguageServerFromPuppetAgent] ';
    // setup defaults
    let spawn_options: cp.SpawnOptions = {}
    spawn_options.env = process.env;
    let result = {
      command: 'ruby',
      args: [serverExe],
      options: spawn_options,
    }
    let puppetAgentDir: string = null;

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

        if (this.connectionConfiguration.puppetAgentDir == undefined) {
          puppetAgentDir = path.join(programFiles, "Puppet Labs", "Puppet");
        } else {
          puppetAgentDir = this.connectionConfiguration.puppetAgentDir;
        }

        result.options.stdio = 'pipe';
        break;
      default:
        if (this.connectionConfiguration.puppetAgentDir == undefined) {
          puppetAgentDir = '/opt/puppetlabs/puppet';
        } else {
          puppetAgentDir = this.connectionConfiguration.puppetAgentDir;
        }

        result.options.stdio = 'pipe';
        result.options.shell = true;
        break;
    }
    // Check if this really is a Puppet Agent installation
    if (!fs.existsSync(path.join(puppetAgentDir, "VERSION"))) {
      this.logger.debug(logPrefix + "Could not find a valid Puppet Agent installation at " + puppetAgentDir);
      return null;
    } else {
      this.logger.debug(logPrefix + "Found a valid Puppet Agent installation at " + puppetAgentDir);
    }

    let puppetDir = path.join(puppetAgentDir,"puppet");
    let facterDir = path.join(puppetAgentDir,"facter");
    let hieraDir = path.join(puppetAgentDir,"hiera");
    let mcoDir = path.join(puppetAgentDir,"mcollective");
    let rubydir = path.join(puppetAgentDir,"sys","ruby");
    let rubylib = path.join(puppetDir,"lib") + this.pathEnvSeparator() + path.join(facterDir,"lib") + this.pathEnvSeparator() + path.join(hieraDir,"lib") + this.pathEnvSeparator() + path.join(mcoDir,"lib")

    if (process.platform == 'win32') {
      // Translate all slashes to / style to avoid puppet/ruby issue #11930
      rubylib = rubylib.replace(/\\/g,"/");
    }

    // Setup the process environment variables
    if (result.options.env.PATH == undefined) { result.options.env.PATH = ''; }
    if (result.options.env.RUBYLIB == undefined) { result.options.env.RUBYLIB = ''; }
    result.options.env.RUBY_DIR = rubydir;
    result.options.env.PATH = path.join(puppetDir,"bin") + this.pathEnvSeparator() + path.join(facterDir,"bin") + this.pathEnvSeparator() + path.join(hieraDir,"bin") + this.pathEnvSeparator() + path.join(mcoDir,"bin") +
                              this.pathEnvSeparator() + path.join(puppetAgentDir,"bin") + this.pathEnvSeparator() + path.join(rubydir,"bin") + this.pathEnvSeparator() + path.join(puppetAgentDir,"sys","tools","bin") +
                              this.pathEnvSeparator() + result.options.env.PATH;
    result.options.env.RUBYLIB = rubylib + this.pathEnvSeparator() + result.options.env.RUBYLIB;
    result.options.env.RUBYOPT = 'rubygems';
    result.options.env.SSL_CERT_FILE = path.join(puppetDir,"ssl","cert.pem");
    result.options.env.SSL_CERT_DIR = path.join(puppetDir,"ssl","certs");

    this.logger.debug(logPrefix + "Using environment variable RUBY_DIR=" + result.options.env.RUBY_DIR);
    this.logger.debug(logPrefix + "Using environment variable PATH=" + result.options.env.PATH);
    this.logger.debug(logPrefix + "Using environment variable RUBYLIB=" + result.options.env.RUBYLIB);
    this.logger.debug(logPrefix + "Using environment variable RUBYOPT=" + result.options.env.RUBYOPT);
    this.logger.debug(logPrefix + "Using environment variable SSL_CERT_FILE=" + result.options.env.SSL_CERT_FILE);
    this.logger.debug(logPrefix + "Using environment variable SSL_CERT_DIR=" + result.options.env.SSL_CERT_DIR);

    return result;
  }

  // Commented out for the moment.  This will be enabled once the configuration and 
  // exact user story is figured out.
  //
  // private getLanguageServerFromPDK(serverExe) {
  //   let logPrefix: string = '[getLanguageServerFromPDK] ';
  //   // setup defaults
  //   let spawn_options: cp.SpawnOptions = {}
  //   spawn_options.env = process.env;
  //   let result = {
  //     command: 'ruby',
  //     args: [serverExe],
  //     options: spawn_options,
  //   }
  //   let pdkDir: string = null;

  //   // type Platform = 'aix'
  //   //               | 'android'
  //   //               | 'darwin'
  //   //               | 'freebsd'
  //   //               | 'linux'
  //   //               | 'openbsd'
  //   //               | 'sunos'
  //   //               | 'win32';
  //   switch (process.platform) {
  //     case 'win32':
  //       let comspec: string = process.env["COMSPEC"];
  //       let programFiles = process.env["ProgramFiles"];
  //       if (process.env["PROCESSOR_ARCHITEW6432"] == "AMD64") {
  //         // VSCode is running as 32bit process on a 64bit Operating System.  Need to break out
  //         // of the 32bit using the sysnative redirection and environment variables
  //         comspec = path.join(process.env["WINDIR"],"sysnative","cmd.exe");
  //         programFiles = process.env["ProgramW6432"];
  //       }

  //       pdkDir = path.join(programFiles, "Puppet Labs", "DevelopmentKit");

  //       result.options.stdio = 'pipe';
  //       break;
  //     default:
  //       pdkDir = '/opt/puppetlabs/pdk';

  //       result.options.stdio = 'pipe';
  //       result.options.shell = true;
  //       break;
  //   }
  //   // Check if this really is a PDK installation
  //   if (!fs.existsSync(path.join(pdkDir, "PDK_VERSION"))) {
  //     this.logger.debug(logPrefix + "Could not find a valid PDK installation at " + pdkDir);
  //     return null;
  //   } else {
  //     this.logger.debug(logPrefix + "Found a valid PDK installation at " + pdkDir);
  //   }
      
  //   // Now to detect ruby versions
  //   let subdirs = this.getDirectories(path.join(pdkDir,"private", "ruby"));
  //   if (subdirs.length == 0) { return null; }
  //   let rubyDir = path.join(pdkDir,"private", "ruby",subdirs[0]);

  //   subdirs = this.getDirectories(path.join(pdkDir,"share","cache","ruby"));
  //   if (subdirs.length == 0) { return null; }
  //   let gemDir = path.join(pdkDir,"share","cache","ruby",subdirs[0]);

  //   let rubylib = path.join(pdkDir,'lib')
  //   if (process.platform == 'win32') {
  //     // Translate all slashes to / style to avoid puppet/ruby issue #11930
  //     rubylib = rubylib.replace(/\\/g,"/");
  //     gemDir = gemDir.replace(/\\/g,"/");
  //   }

  //   // Setup the process environment variables
  //   if (result.options.env.PATH == undefined) { result.options.env.PATH = '' }
  //   if (result.options.env.RUBYLIB == undefined) { result.options.env.RUBYLIB = '' }
    
  //   result.options.env.RUBY_DIR = rubyDir;
  //   result.options.env.PATH = path.join(pdkDir,'bin') + this.pathEnvSeparator() + path.join(rubyDir,'bin') + this.pathEnvSeparator() + result.options.env.PATH;
  //   result.options.env.RUBYLIB = path.join(pdkDir,'lib') + this.pathEnvSeparator() + result.options.env.RUBYLIB;
  //   result.options.env.GEM_PATH = gemDir;
  //   result.options.env.GEM_HOME = gemDir;
  //   result.options.env.RUBYOPT = 'rubygems';

  //   this.logger.debug(logPrefix + "Using environment variable RUBY_DIR=" + result.options.env.RUBY_DIR);
  //   this.logger.debug(logPrefix + "Using environment variable PATH=" + result.options.env.PATH);
  //   this.logger.debug(logPrefix + "Using environment variable RUBYLIB=" + result.options.env.RUBYLIB);
  //   this.logger.debug(logPrefix + "Using environment variable GEM_PATH=" + result.options.env.GEM_PATH);
  //   this.logger.debug(logPrefix + "Using environment variable GEM_HOME=" + result.options.env.GEM_HOME);
  //   this.logger.debug(logPrefix + "Using environment variable RUBYOPT=" + result.options.env.RUBYOPT);
    
  //   return result;
  // }

  private createLanguageServerProcess(serverExe: string, callback : Function) {
    let logPrefix: string = '[createLanguageServerProcess] ';
    this.logger.debug(logPrefix + 'Language server found at: ' + serverExe)

    let localServer = null

    if (localServer == null) { localServer = this.getLanguageServerFromPuppetAgent(serverExe); }
    // if (localServer == null) { localServer = this.getLanguageServerFromPDK(serverExe); }

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

  public restartConnection(connectionConfig?: IConnectionConfiguration) {
    if (connectionConfig == undefined) {
      connectionConfig = new ConnectionConfiguration(this.extensionContext);
    }
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

    menuItems.push(
      new ConnectionMenuItem(
        "Restart Current Puppet Session",
        () => { vscode.commands.executeCommand(messages.PuppetCommandStrings.PuppetRestartSessionCommandId); }),
    )

    menuItems.push(
      new ConnectionMenuItem(
        "Show Puppet Session Logs",
        () => { vscode.commands.executeCommand(messages.PuppetCommandStrings.PuppetShowConnectionLogsCommandId); }),
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
