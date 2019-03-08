import * as vscode from 'vscode';
import * as net from 'net';
import * as cp from 'child_process';
import { ServerOptions, Executable, StreamInfo } from 'vscode-languageclient';

import { ConnectionHandler } from '../handler';
import { ConnectionType } from '../settings';
import { ConnectionStatus } from '../interfaces';
import { IPuppetStatusBar } from '../feature/PuppetStatusBarFeature';
import { OutputChannelLogger } from '../logging/outputchannel';
import { CommandEnvironmentHelper } from '../helpers/commandHelper';
import { IAggregateConfiguration } from '../configuration';

export class DockerConnectionHandler extends ConnectionHandler {
  private name: string;

  constructor(
    context: vscode.ExtensionContext,
    statusBar: IPuppetStatusBar,
    logger: OutputChannelLogger,
    config: IAggregateConfiguration,
  ) {
    super(context, statusBar, logger, config);
    this.logger.debug(`Configuring ${ConnectionType[this.connectionType]}::${this.protocolType} connection handler`);

    /*
      The docker container will be assigned a random port on creation, so we don't
      know it unitl we ask via a docker command. Using the unique name created in
      createUniqueDockerName() we can get the port that the Puppet Language
      Server is running on in getDockerPort().
    */
    this.name = this.createUniqueDockerName();

    let exe: Executable = this.getDockerExecutable(this.name, this.config.workspace.editorService.docker.imageName);
    this.logger.debug('Editor Services will invoke with: ' + exe.command + ' ' + exe.args.join(' '));

    /*
      We start the docker container and then listen on stdout for the line that
      indicates the Puppet Language Server is running and ready to accept
      connections. This takes some time, so we can't call start() right away.
      We then call getDockerPort to get the port to connect to.
    */
    var proc = cp.spawn(exe.command, exe.args);
    var isRunning: boolean = false;
    proc.stdout.on('data', data => {
      if (/LANGUAGE SERVER RUNNING/.test(data.toString())) {
        config.workspace.editorService.tcp.port = this.getDockerPort(this.name);
        isRunning = true;
        this.start();
      }
      if (!isRunning) {
        this.logger.debug('Editor Service STDOUT: ' + data.toString());
      }
    });
    proc.stderr.on('data', data => {
      if (!isRunning) {
        this.logger.debug('Editor Service STDERR: ' + data.toString());
      }
    });
    proc.on('close', exitCode => {
      this.logger.debug('Editor Service terminated with exit code: ' + exitCode);
      if (!isRunning) {
        this.setConnectionStatus('Failure', ConnectionStatus.Failed, 'Could not start the docker container');
      }
    });
  }

  // This is always a remote connection
  get connectionType(): ConnectionType {
    return ConnectionType.Remote;
  }

  createServerOptions(): ServerOptions {
    let serverOptions = () => {
      let socket = net.connect({
        port: this.config.workspace.editorService.tcp.port,
        host: this.config.workspace.editorService.tcp.address,
      });

      let result: StreamInfo = {
        writer: socket,
        reader: socket,
      };
      return Promise.resolve(result);
    };
    return serverOptions;
  }

  /*
    Options defined in getDockerArguments() should ensure docker cleans up
    the container on exit, but we do this to ensure the container goes away
  */
  cleanup(): void {
    this.stopLanguageServerDockerProcess(this.name);
  }

  /*
    Unlike stdio or tcp, we don't much care about the shell env variables when
    starting docker containers. We only need docker on the PATH in order for
    this to work, so we copy what's already there and leave most of it be.
  */
  private getDockerExecutable(containerName: string, imageName: string): Executable {
    let exe: Executable = {
      command: this.getDockerCommand(process.platform),
      args: this.getDockerArguments(containerName, imageName),
      options: {},
    };

    exe.options.env = CommandEnvironmentHelper.shallowCloneObject(process.env);
    exe.options.stdio = 'pipe';

    switch (process.platform) {
      case 'win32':
        break;
      default:
        exe.options.shell = true;
        break;
    }

    CommandEnvironmentHelper.cleanEnvironmentPath(exe);

    // undefined or null values still appear in the child spawn environment variables
    // In this case these elements should be removed from the Object
    CommandEnvironmentHelper.removeEmptyElements(exe.options.env);

    return exe;
  }

  /*
    This creates a sufficiently unique name for a docker container that won't
    conflict with other containers on a system, but known enough for us to find
    it if we lose track of it somehow
  */
  private createUniqueDockerName() {
    return 'puppet-vscode-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /*
    This uses docker to query what random port was assigned the container we
    created, and a regex to parse the port number out of the result
  */
  private getDockerPort(name: string) {
    let cmd: string = this.getDockerCommand(process.platform);
    let args: Array<string> = ['port', name, '8082'];
    var proc = cp.spawnSync(cmd, args);
    let regex = /:(\d+)$/m;
    return Number(regex.exec(proc.stdout.toString())[1]);
  }

  // this stops and removes docker containers forcibly
  private stopLanguageServerDockerProcess(name: string): void {
    let cmd: string = this.getDockerCommand(process.platform);
    let args: Array<string> = ['rm', '--force', name];
    let spawn_options: cp.SpawnOptions = {};
    spawn_options.stdio = 'pipe';
    cp.spawn(cmd, args, spawn_options);
  }

  // platform specific docker command
  private getDockerCommand(platform: string): string {
    switch (platform) {
      case 'win32':
        return 'docker.exe';
      default:
        return 'docker';
    }
  }

  // docker specific arguments to start the container how we need it started
  private getDockerArguments(containerName: string, imageName: string) {
    let args = [
      'run', // run a new container
      '--rm', // automatically remove container when it exits
      '-i', // interactive
      '-P', // publish all exposed ports to random ports
      '--name',
      containerName, // assign a name to the container
      imageName, // image to use
    ];
    return args;
  }
}
