import { RequestType0, RequestType } from 'vscode-languageclient';

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
    'puppet/getResource'
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
    'puppet/fixDiagnosticErrors'
  );
}

export interface PuppetFixDiagnosticErrorsResponse {
  documentUri: string;
  fixesApplied: number;
  newContent: string;
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
  static PuppetResourceCommandId: string = 'extension.puppetResource';
  static PuppetShowConnectionMenuCommandId = 'extension.puppetShowConnectionMenu';
  static PuppetShowConnectionLogsCommandId = 'extension.puppetShowConnectionLogs';
}

export class PDKCommandStrings {
  static PdkNewModuleCommandId: string = 'extension.pdkNewModule';
  static PdkNewClassCommandId: string = 'extension.pdkNewClass';
  static PdkNewTaskCommandId: string = 'extension.pdkNewTask';
  static PdkValidateCommandId: string = 'extension.pdkValidate';
  static PdkTestUnitCommandId: string = 'extension.pdkTestUnit';
}
