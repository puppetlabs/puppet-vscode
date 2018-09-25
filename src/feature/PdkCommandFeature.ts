'use strict';

import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';
import { PDKCommandStrings } from '../messages';
import { reporter } from '../telemetry/telemetry';

export class PdkCommandFeature implements IFeature {
  private logger: ILogger;
  private terminal: vscode.Terminal;

  constructor(context:vscode.ExtensionContext, logger: ILogger, terminal: vscode.Terminal) {
    this.logger = logger;
    this.terminal = terminal;
  }

  public dispose(): any {
    this.terminal.dispose();
  }
}
