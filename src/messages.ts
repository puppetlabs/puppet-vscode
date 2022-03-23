/* eslint-disable @typescript-eslint/no-namespace */
import { RequestType, RequestType0 } from 'vscode-languageclient';

export namespace PuppetVersionRequest {
  export const type = new RequestType0<PuppetVersionDetails, void, void>('puppet/getVersion');
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
  export const type = new RequestType<PuppetResourceRequestParams, PuppetResourceResponse, void, void>(
    'puppet/getResource',
  );
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
  export const type = new RequestType<PuppetFixDiagnosticErrorsRequestParams, any, void, void>(
    'puppet/fixDiagnosticErrors',
  );
}

export interface PuppetFixDiagnosticErrorsResponse {
  documentUri: string;
  fixesApplied: number;
  newContent: string;
}

export namespace PuppetNodeGraphRequest {
  export const type = new RequestType<any, PuppetNodeGraphResponse, void, void>('puppet/compileNodeGraph');
}

export interface PuppetNodeGraphResponse {
  vertices: [];
  edges: [];
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

export class PuppetCommandStrings {
  static PuppetResourceCommandId = 'extension.puppetResource';
  static PuppetShowConnectionMenuCommandId = 'extension.puppetShowConnectionMenu';
  static PuppetShowConnectionLogsCommandId = 'extension.puppetShowConnectionLogs';
  static PuppetUpdateConfigurationCommandId = 'extension.puppetUpdateConfiguration';
}

export class PDKCommandStrings {
  static PdkNewModuleCommandId = 'extension.pdkNewModule';
  static PdkNewClassCommandId = 'extension.pdkNewClass';
  static PdkNewTaskCommandId = 'extension.pdkNewTask';
  static PdkNewFactCommandId = 'extension.pdkNewFact';
  static PdkNewFunctionCommandId = 'extension.pdkNewFunction';
  static PdkNewDefinedTypeCommandId = 'extension.pdkNewDefinedType';
  static PdkValidateCommandId = 'extension.pdkValidate';
  static PdkTestUnitCommandId = 'extension.pdkTestUnit';
}

export class PCTCommandStrings {
  static PctNewContentCommandId = 'extension.pctNewContent';
}
