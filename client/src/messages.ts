import { RequestType0, RequestType } from 'vscode-languageclient';

export namespace PuppetVersionRequest {
  export const type = new RequestType0<PuppetVersionDetails, void, void>('puppet/getVersion');
}

export interface PuppetVersionDetails {
  puppetVersion: string;
  facterVersion: string;
}

export interface PuppetResourceRequestParams {
  typename: string;
  title:string;
}

export namespace PuppetResourceRequest {
  export const type = new RequestType<PuppetResourceRequestParams, PuppetResourceResponse, void, void>('puppet/getResource');
}

export interface PuppetResourceResponse {
  data: string;
  error: string;
}

export namespace CompileNodeGraphRequest {
  export const type = new RequestType<any, any, void, void>('puppet/compileNodeGraph');
}

export interface CompileNodeGraphResponse {
  dotContent: string;
  error: string;
  data: string;
}
