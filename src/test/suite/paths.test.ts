import * as assert from 'assert';

import { afterEach, beforeEach, describe, it } from 'mocha';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { PathResolver } from '../../configuration/pathResolver';

describe('Path Resolution Tests', () => {
  it('resolves programfiles', () => {
    switch (process.platform) {
      case 'win32':
        assert.equal('C:\\Program Files', PathResolver.getprogramFiles());
        break;
      default:
        assert.equal('/opt', PathResolver.getprogramFiles());
        break;
    }
  });

  it('resolves environment PATH seperator', () => {
    switch (process.platform) {
      case 'win32':
        assert.equal(';', PathResolver.pathEnvSeparator());
        break;
      default:
        assert.equal(':', PathResolver.pathEnvSeparator());
        break;
    }
  });
});

describe('PathResolver - resolveSubDirectory and getDirectories', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('resolveSubDirectory returns joined path when subdirectory exists', () => {
    sandbox.stub(fs, 'existsSync').returns(true);
    const result = PathResolver.resolveSubDirectory('/opt/puppet', 'ruby');
    assert.equal(result, require('path').join('/opt/puppet', 'ruby'));
  });

  it('resolveSubDirectory returns first subdirectory when path does not exist', () => {
    sandbox.stub(fs, 'existsSync').returns(false);
    sandbox.stub(fs, 'readdirSync').returns(['2.7.0', '3.0.0'] as any);
    sandbox.stub(fs, 'statSync').returns({ isDirectory: () => true } as any);
    const result = PathResolver.resolveSubDirectory('/opt/puppet', 'ruby');
    assert.equal(result, '3.0.0');
  });

  it('getDirectories filters out non-directory entries', () => {
    sandbox.stub(fs, 'readdirSync').returns(['dir1', 'file.txt', 'dir2'] as any);
    sandbox.stub(fs, 'statSync').callsFake((p: any) => ({
      isDirectory: () => !String(p).endsWith('.txt'),
    } as any));
    const result = PathResolver.getDirectories('/some/path');
    assert.deepEqual(result, ['dir1', 'dir2']);
  });
});
