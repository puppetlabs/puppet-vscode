'use strict';

import * as vscode from 'vscode';
import fs = require('fs');
import path = require('path');
import net = require('net');
import { DebugProtocol } from 'vscode-debugprotocol';
import cp = require('child_process');
import { NullLogger } from './logging/null';
import { ILogger } from './logging';
import { RubyHelper } from './rubyHelper';
import { IConnectionConfiguration, ConnectionType } from './interfaces';
import { PuppetExtensionConfiguration } from './puppetExtensionConfiguration';

// This code just marshalls the STDIN/STDOUT to a socket

// Pause the stdin buffer until we're connected to the debug server
process.stdin.pause();

class DebugErrorResponse implements DebugProtocol.ErrorResponse {
  
  // tslint:disable-next-line:semicolon
  public body!: {
    // tslint:disable-next-line:no-unused-expression
    error?: DebugProtocol.Message | undefined;
  }
  public request_seq: number = 1;
  // tslint:disable-next-line:no-unused-expression
  public message?: string;
  public success: boolean = false;
  public command: string = "initialize";
  public seq: number = 1;
  public type: string = "response";

  // tslint:disable-next-line:semicolon
  constructor(errorMessage: string) {
    this.message = errorMessage;
  }
}

function sendErrorMessage(message: string) {
  let mesageObject = new DebugErrorResponse(message);
  let jsonMessage:string = JSON.stringify(mesageObject);
  let payloadString = `Content-Length: ${jsonMessage.length}\r\n\r\n${jsonMessage}`;

  process.stdout.write(payloadString);
}

class DebugConfiguration implements IConnectionConfiguration {
  public type: ConnectionType = ConnectionType.Local ;
  public host: string = "127.0.0.1";
  public port: number = 8082;
  public timeout: number = 10;
  public enableFileCache!: boolean;// tslint:disable-line:semicolon
  public debugFilePath!: string; // tslint:disable-line:semicolon

  public puppetAgentDir!: string;// tslint:disable-line:semicolon
}

function startDebuggingProxy(config:DebugConfiguration, logger:ILogger, exitOnClose:boolean = false) {
  // Establish connection before setting up the session
  logger.debug("Connecting to " + config.host + ":" + config.port);

  // let isConnected = false;
  let debugServiceSocket = net.connect(config.port, config.host);

  // Write any errors to the log file
  debugServiceSocket.on('error', (e) => {
      logger.error("Socket ERROR: " + e);
      debugServiceSocket.destroy();
    });

  // Route any output from the socket through stdout
  debugServiceSocket.on('data', (data: Buffer) => process.stdout.write(data));

  // Wait for the connection to complete
  debugServiceSocket.on('connect', () => {
      // isConnected = true;
      logger.debug("Connected to Debug Server");

      // When data comes on stdin, route it through the socket
      process.stdin.on('data',(data: Buffer) => debugServiceSocket.write(data));

      // Resume the stdin stream
      process.stdin.resume();
    });

  // When the socket closes, end the session
  debugServiceSocket.on('close',() => {
    logger.debug("Socket closed, shutting down.");
    debugServiceSocket.destroy();
    // isConnected = false;
    if (exitOnClose) { process.exit(0); }
  });
}

function startDebugServerProcess(cmd : string, args : Array<string>, config:DebugConfiguration, logger:ILogger, options : cp.SpawnOptions) {
  if ((config.host === undefined) || (config.host === '')) {
    args.push('--ip=127.0.0.1');
  } else {
    args.push('--ip=' + config.host);
  }
  args.push('--port=' + config.port);
  args.push('--timeout=' + config.timeout);
  if ((config.debugFilePath !== undefined) && (config.debugFilePath !== '')) {
    args.push('--debug=' + config.debugFilePath);
  }

  logger.debug("Starting the debug server with " + cmd + " " + args.join(" "));
  var proc = cp.spawn(cmd, args, options);
  logger.debug('Debug server PID:' + proc.pid);

  return proc;
}

function startDebugServer(config:DebugConfiguration, extensionConfig:PuppetExtensionConfiguration, debugLogger: ILogger) {
  let localServer = null;

  let rubyfile = path.join(__dirname,'..','..','vendor', 'languageserver', 'puppet-debugserver');
  if (!fs.existsSync(rubyfile)) {
    sendErrorMessage("Unable to find the Debug Server at " + rubyfile);
    process.exit(255);
  }

  // TODO use argv to pass in stuff?
  if (localServer === null) { localServer = RubyHelper.getRubyEnvFromPuppetAgent(
    rubyfile,
    config,
    extensionConfig,
    debugLogger); }
  // Commented out for the moment.  This will be enabled once the configuration and exact user story is figured out.
  // if (localServer == null) { localServer = RubyHelper.getRubyEnvFromPDK(rubyfile, config, debugLogger); }

  if (localServer === null) {
    sendErrorMessage("Unable to find a valid ruby environment");
    process.exit(255);
  }

  var debugServerProc = startDebugServerProcess(localServer.command, localServer.args, config, debugLogger, localServer.options);

  let debugSessionRunning = false;
  debugServerProc.stdout.on('data', (data) => {
    debugLogger.debug("OUTPUT: " + data.toString());

    // If the language client isn't already running and it's sent the trigger text, start up a client
    if ( !debugSessionRunning && (data.toString().match("DEBUG SERVER RUNNING") !== null) ) {
      debugSessionRunning = true;
      startDebuggingProxy(config, debugLogger);
    }
  });

  return debugServerProc;
}

function startDebugging(config:DebugConfiguration, extensionConfig:PuppetExtensionConfiguration, debugLogger:ILogger) {
  var debugServerProc = startDebugServer(config, extensionConfig, debugLogger);

  debugServerProc.on('close', (exitCode) => {
    debugLogger.debug("Debug server terminated with exit code: " + exitCode);
    debugServerProc.kill();
    process.exit(exitCode);
  });

  debugServerProc.on('error', (data) => {
    debugLogger.error(data.message);
  });

  process.on('SIGTERM', () => {
    debugLogger.debug("Received SIGTERM");
    debugServerProc.kill();
    process.exit(0);
  });

  process.on('SIGHUP', () => {
    debugLogger.debug("Received SIGHUP");
    debugServerProc.kill();
    process.exit(0);
  });

  process.on('exit', () => {
    debugLogger.debug("Received Exit");
    debugServerProc.kill();
    process.exit(0);
  });
}

// TODO Do we need a logger? should it be optional?
// var logPath = path.resolve(__dirname, "../logs");
// var logFile = path.resolve(logPath,"DebugAdapter.log");
// let debugLogger = new FileLogger(logFile);
// TODO Until we figure out the logging, just use the null logger
let debugLogger = new NullLogger();

debugLogger.normal("args = " + process.argv);

let config = new DebugConfiguration();
let extensionConfig = new PuppetExtensionConfiguration(vscode.workspace.getConfiguration('puppet'));
// Launch command
startDebugging(config, extensionConfig, debugLogger);

// Attach command
// startDebuggingProxy(config, debugLogger, true);
