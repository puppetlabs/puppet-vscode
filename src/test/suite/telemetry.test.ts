import * as assert from 'assert';
import * as telemetry from '../../telemetry';
import * as index from './index';

suite('Telemetry Tests', () => {
  const reporter = telemetry.reporter;
  test('Telemetry is enabled', () => {
    assert.notStrictEqual(reporter, undefined);
  });
  // test we can actually send a telemetry event
  test('Telemetry calls editorServiceDisabled on activation', async () => {
    const sendTelemetryEventSpy = index.sandbox.spy(reporter, 'sendTelemetryEvent');
    await index.extContext.activate();

    index.sandbox.assert.calledWith(sendTelemetryEventSpy.secondCall, 'editorServiceDisabled');
    sendTelemetryEventSpy.restore();
  });
});
