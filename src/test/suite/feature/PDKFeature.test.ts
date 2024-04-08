import { assert } from 'chai';
import * as fs from 'fs';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { PDKFeature } from '../../../feature/PDKFeature';
import { OutputChannelLogger } from '../../../logging/outputchannel';
import * as index from '../index';

describe('PDKFeature', () => {
  let sandbox: sinon.SinonSandbox;
  let pdkFeature: PDKFeature;
  let mockContext: vscode.ExtensionContext;
  let mockLogger: OutputChannelLogger;
  let registerCommandStub: sinon.SinonStub;
  const moduleName = 'testmodule';
  const dir = '/path/to/directory';

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockContext = index.extContext;
    mockLogger = index.logger;
    registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand').returns(() => {});
    pdkFeature = new PDKFeature(mockContext, mockLogger);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should register commands', () => {
      assert(registerCommandStub.called);
    });
  });

  describe('getTerminal', () => {
    it('should return an existing terminal if one exists', () => {
      const terminal = { name: 'Puppet PDK' };
      sandbox.stub(vscode.window, 'terminals').value([terminal]);
      const result = (pdkFeature as any).getTerminal();
      assert.strictEqual(result.name, terminal.name);
    });

    it('should create a new terminal if none exists', () => {
      sandbox.stub(vscode.window, 'terminals').value([]);
      const createTerminalStub = sandbox.stub(vscode.window, 'createTerminal').returns({ name: 'Puppet PDK' } as vscode.Terminal);
      (pdkFeature as any).getTerminal();
      assert(createTerminalStub.calledWith('Puppet PDK'));
      createTerminalStub.restore();
    });
  });

  describe('pdkNewModuleCommand', () => {
    it('should send a command to the terminal', async () => {
      sandbox.stub(vscode.window, 'showInputBox').returns(Promise.resolve(moduleName));
      sandbox.stub(vscode.window, 'showOpenDialog').returns(Promise.resolve([vscode.Uri.file(dir)]));
      const terminal = { sendText: sandbox.stub(), show: sandbox.stub() };
      sandbox.stub(pdkFeature, 'getTerminal').returns(terminal);
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(vscode.commands, 'executeCommand');

      await (pdkFeature as any).pdkNewModuleCommand();
      assert(terminal.sendText.calledWith(`pdk new module --skip-interview ${moduleName} ${path.join(dir, moduleName)}`));
    });

    it('should show a warning if no module name is specified', async () => {
      const showWarningMessageStub = sandbox.stub(vscode.window, 'showWarningMessage');
      sandbox.stub(vscode.window, 'showInputBox').returns('');
      sandbox.stub(vscode.window, 'showOpenDialog').returns(Promise.resolve([vscode.Uri.file(dir)]));
      await (pdkFeature as any).pdkNewModuleCommand();
      assert(showWarningMessageStub.calledWith('No module name specifed. Exiting.'));
      showWarningMessageStub.restore();
    });

    it('should show a warning if no directory is specified', async () => {
      const showWarningMessageStub = sandbox.stub(vscode.window, 'showWarningMessage');
      sandbox.stub(vscode.window, 'showInputBox').returns(moduleName);
      sandbox.stub(vscode.window, 'showOpenDialog').returns('');
      await (pdkFeature as any).pdkNewModuleCommand();
      assert(showWarningMessageStub.calledWith('No directory specifed. Exiting.'));
      showWarningMessageStub.restore();
    });
  });

  describe('dispose', () => {
    it('should dispose the terminal', () => {
      const terminal = { dispose: sandbox.stub() };
      sandbox.stub(pdkFeature, 'getTerminal').returns(terminal);
      pdkFeature.dispose();
      assert(terminal.dispose.called);
    });
  });
});
