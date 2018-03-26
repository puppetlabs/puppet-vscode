'use strict';

// Only add simple interfaces here. No import's allowed

export enum ConnectionStatus {
  NotStarted,
  Starting,
  Running,
  Stopping,
  Failed
}

export enum ConnectionType {
  Unknown,
  Local,
  Remote
}

export enum ProtocolType{
  UNKNOWN,
  STDIO,
  TCP
}

export interface IConnectionConfiguration {
  protocolType: ProtocolType;
  type: ConnectionType;
  host: string;
  port: number;
  timeout: number;
  preLoadPuppet: boolean;
  debugFilePath: string;
  puppetAgentDir: string;
}
