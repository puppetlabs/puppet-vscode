import * as vscode from 'vscode';

export class PuppetConfig{
  _findPuppetPath():String{

    let config = vscode.workspace.getConfiguration('puppet');
    // config['puppet']
    // Object {enable: true, path: "foo"}
    // config['puppet']['enable']
    // true
    let path  = '';
    if(config['path'] !== ""){
      path = config['path']
    }else{
      if(process.platform == "win32"){
        path = "C:\\Program Files\PuppetLabs\puppet";
      }else{
        path = "fii";
      }
    }
    return path;
  }

}