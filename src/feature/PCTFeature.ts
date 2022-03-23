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

  private async getTemplateQuickPickList(): Promise<vscode.QuickPickItem[]> {
    let items: vscode.QuickPickItem[] = [];

    try {
      this.logger.debug('Fetching templates');
      const cmdResponse = await this.pct.execute(['new', '--list', '--format json']);
      const templates = JSON.parse(cmdResponse);

      if (templates.length < 1) {
        vscode.window.showWarningMessage('No templates were found on the system');
        return items;
      }

      items = templates.map((template: { Id: string; Author: string; Display: string }) => ({
        label: `${template.Author}/${template.Id}`,
        description: template.Display,
      }));
    } catch (err) {
      vscode.window.showErrorMessage('Failed to fetch templates!');
    }

    return items;
  }

  private async createContent(): Promise<void> {
    this.logger.debug('Starting content creation');

    const templates = await this.getTemplateQuickPickList();
    if (templates.length < 1) {
      return;
    }

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

    if (!targetName) {
      vscode.window.showWarningMessage('A name was not specifed. Exiting.');
      return;
    }

    const targetDir = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });

    try {
      await this.pct.execute([
        'new',
        selectedTemplate.label,
        `--name ${targetName}`,
        `--output ${targetDir[0].fsPath}`,
        '--format json',
      ]);
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
      return;
    }

    vscode.window.showInformationMessage(`Published content '${selectedTemplate.detail} to ${targetDir[0].fsPath}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispose(): void {}
}
