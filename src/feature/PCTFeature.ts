import * as vscode from 'vscode';
import { IAggregateConfiguration } from '../configuration';
import { IFeature } from '../feature';
import { IExecHelper, PctExecHelper } from '../helpers/pctExecHelper';
import { ILogger } from '../logging';
import { PCTCommandStrings } from '../messages';

export class PCTFeature implements IFeature {
  private readonly logger: ILogger;
  private readonly pct: IExecHelper;

  constructor(context: vscode.ExtensionContext, config: IAggregateConfiguration, logger: ILogger) {
    this.logger = logger;
    this.pct = new PctExecHelper(config, logger);

    context.subscriptions.push(
      vscode.commands.registerCommand(PCTCommandStrings.PctNewContentCommandId, async () => this.createContent()),
    );
  }

  private async getTemplates(): Promise<vscode.QuickPickItem[]> {
    this.logger.debug('Fetching templates');
    const cmdResponse = await this.pct.execute(['new', '--list', '--format json']);

    const tmpls = JSON.parse(String(cmdResponse));
    const items: vscode.QuickPickItem[] = [];
    tmpls.forEach((t: { Display: string; Author: string; Id: string }) => {
      items.push({
        label: `${t.Author}/${t.Id}`,
        description: t.Display,
      });
    });
    return items;
  }

  private async createContent(): Promise<void> {
    this.logger.debug('Starting content creation');
    const templates = await this.getTemplates();

    const selectedTemplate = await vscode.window.showQuickPick(templates, {
      canPickMany: false,
      ignoreFocusOut: true,
      placeHolder: 'Select a template',
    });

    if (selectedTemplate === undefined) {
      vscode.window.showWarningMessage('No template was specifed. Exiting.');
      return;
    }

    const targetName = await vscode.window.showInputBox({
      placeHolder: `Enter a name for ${selectedTemplate.label}`,
    });

    const targetDir = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });

    await this.pct.execute([
      'new',
      selectedTemplate.label,
      `--name ${targetName}`,
      `--output ${targetDir[0].fsPath}`,
      '--format json',
    ]);

    vscode.window.showInformationMessage(`Created ${targetName} in ${targetDir[0].fsPath}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispose(): void {}
}
