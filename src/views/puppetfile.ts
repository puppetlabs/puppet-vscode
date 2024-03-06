import * as path from 'path';
import {
  commands,
  Event,
  EventEmitter,
  ProviderResult,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  ViewColumn,
  window,
  workspace,
} from 'vscode';
import { RequestType } from 'vscode-languageclient';
import { ConnectionHandler } from '../handler';
import { reporter } from '../telemetry';

class PuppetfileDependencyItem extends TreeItem {
  constructor(
    public readonly name: string,
    public readonly version: string,
    public readonly startLine: number,
    public readonly endLine: number,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly children?: Array<[string, PuppetfileDependencyItem]>,
  ) {
    super(name, collapsibleState);
    this.tooltip = `${name}-${version}`;
    this.description = version;
    if (children) {
      this.iconPath = ThemeIcon.Folder;
    } else {
      this.iconPath = new ThemeIcon('package');
    }
  }
}

class PuppetfileDependency {
  constructor(
    public readonly name: string,
    public readonly version: string,
    public readonly startLine: number,
    public readonly endLine: number,
  ) {
    //
  }
}

interface PuppetfileDependencyResponse {
  dependencies: PuppetfileDependency[];
  error: string[];
}

export class PuppetfileProvider implements TreeDataProvider<PuppetfileDependencyItem> {
  private _onDidChangeTreeData: EventEmitter<PuppetfileDependencyItem | undefined> = new EventEmitter<
    PuppetfileDependencyItem | undefined
  >();
  readonly onDidChangeTreeData: Event<PuppetfileDependencyItem | undefined>;

  constructor(protected handler: ConnectionHandler) {
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    commands.registerCommand('puppet.refreshPuppetfileDependencies', () => {
      reporter.sendTelemetryEvent('puppet.refreshPuppetfileDependencies');
      this.refresh();
    });
    commands.registerCommand('puppet.goToPuppetfileDefinition', (puppetModule: PuppetfileDependencyItem) => {
      reporter.sendTelemetryEvent('puppet.goToPuppetfileDefinition');

      const workspaceFolder = workspace.workspaceFolders[0].uri;
      const puppetfile = path.join(workspaceFolder.fsPath, 'Puppetfile');
      workspace.openTextDocument(puppetfile).then((doc) => {
        const line = doc.lineAt(+puppetModule.startLine);
        window.showTextDocument(doc, {
          preserveFocus: true,
          preview: false,
          selection: line.range,
          viewColumn: ViewColumn.Active,
        });
      });
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(null);
  }

  getTreeItem(element: PuppetfileDependencyItem): TreeItem | Thenable<PuppetfileDependencyItem> {
    return element;
  }

  getChildren(element?: PuppetfileDependencyItem): Promise<PuppetfileDependencyItem[]> {
    if (element) {
      return Promise.resolve(element.children.map((e) => e[1]));
    } else {
      return this.getPuppetfileDependenciesFromLanguageServer();
    }
  }

  private async getPuppetfileDependenciesFromLanguageServer(): Promise<PuppetfileDependencyItem[]> {
    await this.handler.languageClient.start();

    const fileUri = Uri.file(path.join(workspace.workspaceFolders[0].uri.fsPath, 'Puppetfile'));
    /*
     We use openTextDocument here because we need to parse whether or not a user has opened a
     Puppetfile or not. This triggers onDidOpen notification which sends the content of the Puppetfile
     to the Puppet Language Server which caches the content for puppetfile-resolver to parse
    */
    return workspace.openTextDocument(fileUri).then(async () => {
      const results = await this.handler.languageClient.sendRequest(
        new RequestType<never, PuppetfileDependencyResponse, void>('puppetfile/getDependencies'),
        {
          uri: fileUri.toString(),
        },
      );

      reporter.sendTelemetryEvent('puppetfileView');

      if (results.error) {
        window.showErrorMessage(`${results.error}`);
      }

      const list = results.dependencies.map((d) => {
        return new PuppetfileDependencyItem(d.name, d.version, d.startLine, d.endLine, TreeItemCollapsibleState.None);
      });

      return list;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getParent?(element: PuppetfileDependencyItem): ProviderResult<PuppetfileDependencyItem> {
    throw new Error('Method not implemented.');
  }
}
