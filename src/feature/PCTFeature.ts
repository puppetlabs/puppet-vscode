import * as cp from 'promisify-child-process';
import * as vscode from 'vscode';
import { IFeature } from '../feature';
import { ILogger } from '../logging';

export class PCTFeature implements IFeature {
  constructor(context: vscode.ExtensionContext, logger: ILogger) {
    context.subscriptions.push(
      vscode.commands.registerCommand('pct.NewContent', async () => {
        logger.debug('foo');

        const items = await this.getInstalledTemplates();

        const f = await vscode.window.showQuickPick(items, {
          canPickMany: false,
          ignoreFocusOut: true,
          placeHolder: 'Select a Puppet Content Template',
        });
        if (f === undefined) {
          vscode.window.showWarningMessage('No PCT was specifed. Exiting.');
          return;
        }

        logger.debug(f.label);

        const targetName = await vscode.window.showInputBox({});
        logger.debug(targetName);

        const targetDir = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
        });
        logger.debug(targetDir[0].path);

        await this.executeCommand(f.description, targetName, targetDir[0].fsPath);
      }),
    );
  }

  private async executeCommand(tmplName: string, targetName: string, targetFolder: string): Promise<void> {
    const { stdout, stderr } = await cp.exec(
      `pct new ${tmplName} --name ${targetName} --output ${targetFolder} --format json`,
    );
    // if (stderr !== undefined) {
    //   vscode.window.showErrorMessage('foo');
    //   return;
    // }

    const files = JSON.parse(String(stdout));
    const uri = vscode.Uri.file(files[0]);
    await vscode.commands.executeCommand('vscode.openFolder', uri);
  }

  private async getInstalledTemplates(): Promise<vscode.QuickPickItem[]> {
    const { stdout } = await cp.exec('pct new --list --format json');
    const tmpls = JSON.parse(String(stdout));
    const items: vscode.QuickPickItem[] = [];
    tmpls.forEach((t: { Display: string; Id: string }) => {
      items.push({
        label: t.Display,
        description: t.Id,
      });
    });
    return items;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispose(): void {}
}
