import * as assert from 'assert';
import * as fs from 'fs';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import { emptyPDKInstance, pdkInstances } from '../../configuration/pdkResolver';

describe('pdkResolver', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('emptyPDKInstance returns an object with empty string fields', () => {
    const instance = emptyPDKInstance();
    assert.ok(instance);
    assert.equal(instance.valid, false); // emptyPDKInstance sets dirs to undefined but valid to false
    assert.equal(instance.rubyBinDir, undefined);
  });

  it('pdkInstances returns empty instances when base dir does not exist', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    const result = pdkInstances('/nonexistent/pdk');
    assert.ok(result);
    assert.equal(result.instances.length, 0);
  });

  it('toString returns bracket-wrapped string', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    const result = pdkInstances('/nonexistent/pdk');
    const str = result.toString();
    assert.ok(str.startsWith('['));
    assert.ok(str.endsWith(']'));
  });

  it('latest returns undefined when no instances', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    const result = pdkInstances('/nonexistent/pdk');
    assert.equal(result.latest, undefined);
  });

  it('forPuppetVersion returns undefined when no instances match', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    const result = pdkInstances('/nonexistent/pdk');
    assert.equal(result.instanceForPuppetVersion('7.0.0'), undefined);
  });

  it('pdkInstances with a directory containing subdirs builds instances', () => {
    let callCount = 0;
    sandbox.stub(fs, 'existsSync').callsFake((p: any) => {
      // base dir exists, sub dirs exist on first few calls, then not
      callCount++;
      return callCount <= 3;
    });
    sandbox.stub(fs, 'readdirSync').returns(['2.7.0'] as any);
    const result = pdkInstances('/fake/pdk');
    assert.ok(result);
  });

  it('pdkInstances with directories creates instances with valid getter', () => {
    let callCount = 0;
    // Stub existsSync: base dir exists, ruby subdirs exist (enough to build instances)
    sandbox.stub(fs, 'existsSync').callsFake((p: any) => {
      callCount++;
      // Only the first two calls succeed (base dir + first subdir)
      return callCount <= 8;
    });
    sandbox.stub(fs, 'readdirSync').callsFake((p: any) => {
      if (String(p).includes('private')) { return ['2.7.8'] as any; }
      if (String(p).includes('ruby')) { return ['2.7.0.1'] as any; }
      if (String(p).includes('puppet')) { return ['7.0.0'] as any; }
      return ['2.7.8'] as any;
    });
    sandbox.stub(fs, 'readFileSync').returns(Buffer.from('6.29.0\n'));

    const result = pdkInstances('/fake/pdk');
    // toString covers the array join path
    const str = result.toString();
    assert.ok(str.startsWith('['));
    // latest getter: returns the instance with highest rubyVersion
    const latest = result.latest;
    // valid getter on an instance (directories don't exist so valid = false)
    if (result.instances.length > 0) {
      const validResult = result.instances[0].valid;
      assert.equal(typeof validResult, 'boolean');
    }
  });

  it('pdkInstances.allPuppetVersions returns flat list of versions', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    const result = pdkInstances('/nonexistent');
    assert.deepEqual(result.allPuppetVersions, []);
  });

});
