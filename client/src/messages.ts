import { RequestType0 } from 'vscode-languageclient';


export namespace PuppetVersionRequest {
  export const type = new RequestType0<PuppetVersionDetails, void, void>('puppet/getVersion');
}

export interface PuppetVersionDetails {
  puppetVersion: string;
  facterVersion: string;
}