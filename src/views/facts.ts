import {
  TreeItem,
  TreeItemCollapsibleState,
  ThemeIcon,
  TreeDataProvider,
  Event,
  EventEmitter,
  commands,
  ProviderResult,
} from 'vscode';
import { RequestType0 } from 'vscode-languageclient';
import { ConnectionHandler } from '../handler';
import { PuppetVersionDetails } from '../messages';
import { reporter } from '../telemetry';

class PuppetFact extends TreeItem {
  constructor(
    public readonly label: string,
    private value: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly children?: Array<[string, PuppetFact]>
  ) {
    super(label, collapsibleState);
    if (children) {
      this.iconPath = ThemeIcon.Folder;
    } else {
      this.iconPath = ThemeIcon.File;
    }
  }

  get tooltip(): string {
    return `${this.label}-${this.value}`;
  }

  get description(): string {
    return this.value;
  }
}

interface PuppetFactResponse {
  facts: string;
  error: string;
}

export class PuppetFactsProvider implements TreeDataProvider<PuppetFact> {
  private elements: Array<[string, PuppetFact]> = [];
  private _onDidChangeTreeData: EventEmitter<PuppetFact | undefined> = new EventEmitter<PuppetFact | undefined>();
  readonly onDidChangeTreeData: Event<PuppetFact | undefined> = this._onDidChangeTreeData.event;

  constructor(protected handler: ConnectionHandler) {
    commands.registerCommand('puppet.refreshFacts', () => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PuppetFact): TreeItem | Thenable<PuppetFact> {
    return element;
  }

  getChildren(element?: PuppetFact): Promise<PuppetFact[]> {
    if (element) {
      return Promise.resolve(element.children.map((e) => e[1]));
    } else {
      return this.getFactsFromLanguageServer();
    }
  }

  private async getFactsFromLanguageServer(): Promise<PuppetFact[]> {
    /*
      this is problematic because we both store this and return the value
      but this allows us to cache the info for quick expands of the node.
      if we didn't cache, we would have to call out for each expand and getting
      facts is slow.
    */
    await this.handler.languageClient.onReady();

    const details = await this.handler.languageClient.sendRequest(
      new RequestType0<PuppetVersionDetails, void, void>('puppet/getVersion')
    );
    if (!details.factsLoaded) {
      // language server is ready, but hasn't loaded facts yet
      return new Promise<PuppetFact[]>((resolve) => {
        let count = 0;
        let handle = setInterval(async () => {
          count++;
          if (count >= 60) {
            clearInterval(handle);

            const results = await this.handler.languageClient.sendRequest(
              new RequestType0<PuppetFactResponse, void, void>('puppet/getFacts')
            );
            this.elements = this.toList(results.facts);

            if (reporter) {
              reporter.sendTelemetryEvent('puppetFacts');
            }

            resolve(this.elements.map((e) => e[1]));
          }

          const details = await this.handler.languageClient.sendRequest(
            new RequestType0<PuppetVersionDetails, void, void>('puppet/getVersion')
          );
          if (details.factsLoaded) {
            clearInterval(handle);

            const results = await this.handler.languageClient.sendRequest(
              new RequestType0<PuppetFactResponse, void, void>('puppet/getFacts')
            );
            this.elements = this.toList(results.facts);

            if (reporter) {
              reporter.sendTelemetryEvent('puppetFacts');
            }

            resolve(this.elements.map((e) => e[1]));
          } else {
            // not ready yet
          }
        }, 1000);
      });
    }

    const results = await this.handler.languageClient.sendRequest(
      new RequestType0<PuppetFactResponse, void, void>('puppet/getFacts')
    );
    this.elements = this.toList(results.facts);

    if (reporter) {
      reporter.sendTelemetryEvent('puppetFacts');
    }

    return this.elements.map((e) => e[1]);
  }

  getParent?(element: PuppetFact): ProviderResult<PuppetFact> {
    throw new Error('Method not implemented.');
  }

  toList(data: any): Array<[string, PuppetFact]> {
    let things: Array<[string, PuppetFact]> = [];

    for (let key of Object.keys(data)) {
      let value = data[key];
      if (Object.prototype.toString.call(value) === '[object Object]') {
        let children = this.toList(value);
        const item = new PuppetFact(key, value, TreeItemCollapsibleState.Collapsed, children);
        things.push([key, item]);
      } else {
        things.push([key, new PuppetFact(key, value.toString(), TreeItemCollapsibleState.None)]);
      }
    }

    return things;
  }
}
