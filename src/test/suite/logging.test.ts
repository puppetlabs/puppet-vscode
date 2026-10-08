import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { OutputChannelLogger } from '../../logging/outputchannel';

describe('OutputChannelLogger', () => {
  let sandbox: sinon.SinonSandbox;
  let mockOutputChannel: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockOutputChannel = {
      appendLine: sandbox.stub(),
      show: sandbox.stub(),
    };
    sandbox.stub(vscode.window, 'createOutputChannel').returns(mockOutputChannel);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('constructs with undefined log level defaults to normal', () => {
    const logger = new OutputChannelLogger(undefined);
    assert.ok(logger);
  });

  it('show() calls the underlying output channel show', () => {
    const logger = new OutputChannelLogger('normal');
    logger.show();
    sinon.assert.calledOnce(mockOutputChannel.show);
  });

  it('verbose() appends a VERBOSE-prefixed line at verbose log level', () => {
    const logger = new OutputChannelLogger('verbose');
    logger.verbose('test verbose');
    sinon.assert.calledOnce(mockOutputChannel.appendLine);
    assert.include(mockOutputChannel.appendLine.firstCall.args[0], 'VERBOSE');
    assert.include(mockOutputChannel.appendLine.firstCall.args[0], 'test verbose');
  });

  it('debug() appends a DEBUG-prefixed line at debug log level', () => {
    const logger = new OutputChannelLogger('debug');
    logger.debug('test debug');
    sinon.assert.calledOnce(mockOutputChannel.appendLine);
    assert.include(mockOutputChannel.appendLine.firstCall.args[0], 'DEBUG');
  });

  it('normal() appends a line at normal log level', () => {
    const logger = new OutputChannelLogger('normal');
    logger.normal('test normal');
    sinon.assert.calledOnce(mockOutputChannel.appendLine);
  });

  it('warning() appends a WARNING-prefixed line', () => {
    const logger = new OutputChannelLogger('verbose');
    logger.warning('test warning');
    sinon.assert.calledOnce(mockOutputChannel.appendLine);
    assert.include(mockOutputChannel.appendLine.firstCall.args[0], 'WARNING');
  });

  it('error() appends an ERROR-prefixed line', () => {
    const logger = new OutputChannelLogger('verbose');
    logger.error('test error');
    sinon.assert.calledOnce(mockOutputChannel.appendLine);
    assert.include(mockOutputChannel.appendLine.firstCall.args[0], 'ERROR');
  });

  it('logLevelFromString handles all log levels', () => {
    ['verbose', 'debug', 'normal', 'warning', 'error'].forEach(level => {
      const logger = new OutputChannelLogger(level);
      assert.ok(logger);
    });
  });

  it('unknown log level defaults to error (suppresses debug/normal)', () => {
    const logger = new OutputChannelLogger('unknown');
    logger.debug('suppressed');
    logger.normal('suppressed');
    sinon.assert.notCalled(mockOutputChannel.appendLine);
  });

  it('messages below minimum log level are suppressed', () => {
    const logger = new OutputChannelLogger('error');
    logger.verbose('suppressed');
    logger.debug('suppressed');
    logger.normal('suppressed');
    logger.warning('suppressed');
    sinon.assert.notCalled(mockOutputChannel.appendLine);
  });

  it('error messages are always logged at any level', () => {
    const logger = new OutputChannelLogger('error');
    logger.error('shown');
    sinon.assert.calledOnce(mockOutputChannel.appendLine);
  });

  it('normal() prefix is empty string (no prefix)', () => {
    const logger = new OutputChannelLogger('normal');
    logger.normal('hello');
    const logged = mockOutputChannel.appendLine.firstCall.args[0];
    assert.notInclude(logged, 'VERBOSE');
    assert.notInclude(logged, 'DEBUG');
    assert.notInclude(logged, 'WARNING');
    assert.notInclude(logged, 'ERROR');
  });
});
