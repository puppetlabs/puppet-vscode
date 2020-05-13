import * as assert from 'assert';

import * as pdk from '../../configuration/pdkResolver';

suite('configuration/pdkResolver Tests', () => {
  test('resolves directories that do not exist as an empty instances array', () => {
    const result = pdk.pdkInstances('/somedirectory/that/does/not/exist');
    assert.equal(result.instances.length, 0);
  });
});
