/* eslint-disable @typescript-eslint/no-namespace */
import { RequestType, RequestType0 } from 'vscode-languageclient/node';

export namespace PuppetVersionRequest {
  export const type = new RequestType0<PuppetVersionDetails, void>('puppet/getVersion');
}

export interface PuppetVersionDetails {
  puppetVersion: string;
  facterVersion: string;
  languageServerVersion: string;
  factsLoaded: boolean;
  functionsLoaded: boolean;
  typesLoaded: boolean;
  classesLoaded: boolean;
}

export interface PuppetResourceRequestParams {
  typename: string;
  title: string;
}

export namespace PuppetResourceRequest {
  export const type = new RequestType<PuppetResourceRequestParams, PuppetResourceResponse, void>('puppet/getResource');
}

export interface PuppetResourceResponse {
  data: string;
  error: string;
}

export interface PuppetFixDiagnosticErrorsRequestParams {
  documentUri: string;
  alwaysReturnContent: boolean;
}

export namespace PuppetFixDiagnosticErrorsRequest {
  export const type = new RequestType<PuppetFixDiagnosticErrorsRequestParams, any, void>('puppet/fixDiagnosticErrors');
}

export interface PuppetFixDiagnosticErrorsResponse {
  documentUri: string;
  fixesApplied: number;
  newContent: string;
}

export namespace PuppetNodeGraphRequest {
  export const type = new RequestType<any, PuppetNodeGraphResponse, void>('puppet/compileNodeGraph');
}

export interface PuppetNodeGraphResponse {
  vertices: [];
  edges: [];
  error: string;
}

export namespace CompileNodeGraphRequest {
  export const type = new RequestType<any, any, void>('puppet/compileNodeGraph');
}

export interface CompileNodeGraphResponse {
  dotContent: string;
  error: string;
  data: string;
}

export class PuppetCommandStrings {
  static puppetResourceCommandId = 'extension.puppetResource';
  static puppetShowConnectionMenuCommandId = 'extension.puppetShowConnectionMenu';
  static puppetShowConnectionLogsCommandId = 'extension.puppetShowConnectionLogs';
  static puppetUpdateConfigurationCommandId = 'extension.puppetUpdateConfiguration';
}

export class PDKCommandStrings {
  static pdkNewModuleCommandId = 'extension.pdkNewModule';
  static pdkNewClassCommandId = 'extension.pdkNewClass';
  static pdkNewTaskCommandId = 'extension.pdkNewTask';
  static pdkNewFactCommandId = 'extension.pdkNewFact';
  static pdkNewFunctionCommandId = 'extension.pdkNewFunction';
  static pdkNewDefinedTypeCommandId = 'extension.pdkNewDefinedType';
  static pdkValidateCommandId = 'extension.pdkValidate';
  static pdkTestUnitCommandId = 'extension.pdkTestUnit';
}
