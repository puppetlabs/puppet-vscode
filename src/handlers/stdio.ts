import * as vscode from 'vscode';
import * as path from 'path';

import { ServerOptions, Executable } from 'vscode-languageclient';
import { ConnectionHandler } from '../handler';
import { ConnectionType, PuppetInstallType, IConnectionConfiguration } from '../interfaces';
import { ISettings } from '../settings';
import { PuppetStatusBar } from '../PuppetStatusBar';
import { OutputChannelLogger } from '../logging/outputchannel';
import { CommandEnvironmentHelper } from '../helpers/commandHelper';

export class StdioConnectionHandler extends ConnectionHandler {
  get connectionType(): ConnectionType {
    return ConnectionType.Local;
  }

  constructor(
    context: vscode.ExtensionContext,
    settings: ISettings,
    statusBar: PuppetStatusBar,
    logger: OutputChannelLogger,
    config: IConnectionConfiguration,
  ) {
    super(context, settings, statusBar, logger, config);
    this.logger.debug(`Configuring ${ConnectionType[this.connectionType]}::${this.protocolType} connection handler`);
    this.start();
  }

  createServerOptions(): ServerOptions {
    let exe: Executable = CommandEnvironmentHelper.getRubyEnvFromConfiguration(
      this.context.asAbsolutePath(this.config.languageServerPath),
      this.settings,
      this.config,
    );

    let logPrefix: string = '';
    switch (this.settings.installType) {
      case PuppetInstallType.PDK:
        logPrefix = '[getRubyEnvFromPDK] ';
        this.logger.debug(logPrefix + 'Using environment variable DEVKIT_BASEDIR=' + exe.options.env.DEVKIT_BASEDIR);
        this.logger.debug(logPrefix + 'Using environment variable GEM_HOME=' + exe.options.env.GEM_HOME);
        this.logger.debug(logPrefix + 'Using environment variable GEM_PATH=' + exe.options.env.GEM_PATH);
        break;
      case PuppetInstallType.PUPPET:
        logPrefix = '[getRubyExecFromPuppetAgent] ';
        this.logger.debug(logPrefix + 'Using environment variable SSL_CERT_FILE=' + exe.options.env.SSL_CERT_FILE);
        this.logger.debug(logPrefix + 'Using environment variable SSL_CERT_DIR=' + exe.options.env.SSL_CERT_DIR);    
        break;
    }
  
    this.logger.debug(logPrefix + 'Using environment variable RUBY_DIR=' + exe.options.env.RUBY_DIR);
    this.logger.debug(logPrefix + 'Using environment variable RUBYLIB=' + exe.options.env.RUBYLIB);
    this.logger.debug(logPrefix + 'Using environment variable PATH=' + exe.options.env.PATH);
    this.logger.debug(logPrefix + 'Using environment variable RUBYOPT=' + exe.options.env.RUBYOPT);

    let serverOptions: ServerOptions = {
      run: exe,
      debug: exe,
    };

    return serverOptions;
  }

  cleanup(): void {
    this.logger.debug(`No cleanup needed for ${this.protocolType}`);
  }
}
