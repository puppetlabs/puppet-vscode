import * as assert from 'assert';
import * as telemetry from '../../telemetry';

suite('Telemetry Tests', () => {
  const reporter = telemetry.reporter;
  test('Telemetry is enabled', () => {
    assert.notStrictEqual(reporter, undefined);
  });
});
