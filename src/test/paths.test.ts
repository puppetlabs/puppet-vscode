import * as assert from 'assert';

import * as vscode from 'vscode';
import { PathResolver } from '../configuration/pathResolver';

describe("Path Resolution Tests", () => {

  it("resolves programfiles", () => {
    switch(process.platform){
      case 'win32':
        assert.equal('C:\\Program Files', PathResolver.getprogramFiles());
        break;
      default:
        assert.equal('/opt', PathResolver.getprogramFiles());
        break;
    }
  });
  
  it("resolves environment PATH seperator", () => {
    switch(process.platform){
      case 'win32':
        assert.equal(';', PathResolver.pathEnvSeparator());
        break;
      default:
        assert.equal(':', PathResolver.pathEnvSeparator());
        break;
    }
  });

});
