import * as vscode from 'vscode';
import { Executable, ServerOptions } from 'vscode-languageclient';
import { IAggregateConfiguration } from '../configuration';
import { IPuppetStatusBar } from '../feature/PuppetStatusBarFeature';
import { ConnectionHandler } from '../handler';
import { CommandEnvironmentHelper } from '../helpers/commandHelper';
import { OutputChannelLogger } from '../logging/outputchannel';
import { ConnectionType, PuppetInstallType } from '../settings';

export class StdioConnectionHandler extends ConnectionHandler {
  get connectionType(): ConnectionType {
    return ConnectionType.Local;
  }

  constructor(
    context: vscode.ExtensionContext,
    statusBar: IPuppetStatusBar,
    logger: OutputChannelLogger,
    config: IAggregateConfiguration,
  ) {
    super(context, statusBar, logger, config);
    this.logger.debug(`Configuring ${ConnectionType[this.connectionType]}::${this.protocolType} connection handler`);
    this.start();
  }

  createServerOptions(): ServerOptions {
    const exe: Executable = CommandEnvironmentHelper.getLanguageServerRubyEnvFromConfiguration(
      this.context.asAbsolutePath(this.config.ruby.languageServerPath),
      this.config,
    );

    let logPrefix = '';
    // eslint-disable-next-line default-case
    switch (this.config.workspace.installType) {
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
    this.logger.debug(logPrefix + 'Editor Services will invoke with: ' + exe.command + ' ' + exe.args.join(' '));

    const serverOptions: ServerOptions = {
      run: exe,
      debug: exe,
    };

    return serverOptions;
  }

  cleanup(): void {
    this.logger.debug(`No cleanup needed for ${this.protocolType}`);
  }
}
