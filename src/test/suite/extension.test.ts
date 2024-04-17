import * as assert from 'assert';
import { after, before, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { provideCompletionItemMiddleware } from '../../extension';
import { PuppetStatusBarFeature } from '../../feature/PuppetStatusBarFeature';
import { ISettings, settingsFromWorkspace } from '../../settings';

describe('Extension Tests', () => {
  let vscodeCommandsRegisterCommandStub: sinon.SinonStub;
  let puppetStatusBarFeatureStub: sinon.SinonStub;
  let settings: ISettings;
  let context: vscode.ExtensionContext;
  let registerDebugAdapterDescriptorFactoryStub: sinon.SinonStub;
  let document: vscode.TextDocument;
  let position: vscode.Position;
  let completionContext: vscode.CompletionContext;
  let token: vscode.CancellationToken;
  let next: sinon.SinonStub
  const sandbox = sinon.createSandbox();

  before(() => {
    vscodeCommandsRegisterCommandStub = sandbox.stub(vscode.commands, 'registerCommand');
    settings = settingsFromWorkspace();
    context = {
      subscriptions: [],
      asAbsolutePath: (relativePath: string) => {
        return `/absolute/path/to/${relativePath}`;
      },
      globalState: {
        get: sandbox.stub(),
      }
    } as vscode.ExtensionContext;
    puppetStatusBarFeatureStub = sandbox.createStubInstance(PuppetStatusBarFeature);
    registerDebugAdapterDescriptorFactoryStub = sandbox.stub(vscode.debug, 'registerDebugAdapterDescriptorFactory');
  });

  beforeEach(() => {
    document = {} as vscode.TextDocument;
    position = new vscode.Position(0, 0);
    completionContext = {} as vscode.CompletionContext;
    token = new vscode.CancellationTokenSource().token;
    next = sandbox.stub();
  });

  after(() => {
    sandbox.restore();
  });

  it('should add command to completion items', async () => {
    const completionItems = [
      new vscode.CompletionItem('item1', vscode.CompletionItemKind.Property),
      new vscode.CompletionItem('item2', vscode.CompletionItemKind.Text),
    ];
    completionItems[0].detail = 'Property';
    completionItems[1].detail = 'Text';
    next.returns(completionItems);

    const result = await provideCompletionItemMiddleware.provideCompletionItem(document, position, context, token, next);

    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].command?.command, 'editor.action.formatDocumentAndMoveCursor');
    assert.strictEqual(result[1].command?.command, 'editor.action.formatDocument');
  });
});
