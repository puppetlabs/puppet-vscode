import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as telemetry from '../../telemetry';

describe('Telemetry Tests', () => {
  const reporter = telemetry.reporter;
  it('Telemetry is enabled', () => {
    assert.notStrictEqual(reporter, undefined);
  });
});
