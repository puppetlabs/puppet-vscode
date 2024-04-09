import * as assert from 'assert';

import { describe, it } from 'mocha';
import * as pdk from '../../configuration/pdkResolver';

describe('configuration/pdkResolver Tests', () => {
  it('resolves directories that do not exist as an empty instances array', () => {
    const result = pdk.pdkInstances('/somedirectory/that/does/not/exist');
    assert.equal(result.instances.length, 0);
  });
});
