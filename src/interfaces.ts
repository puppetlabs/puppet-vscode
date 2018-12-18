'use strict';

// Only add simple interfaces here. No import's allowed
export enum ConnectionStatus {
  NotStarted,
  Starting,
  RunningLoading,
  RunningLoaded,
  Stopping,
  Failed,
  Stopped,
  Initializing,
  InitializationComplete
}

export enum ConnectionType {
  Unknown,
  Local,
  Remote
}

export enum ProtocolType {
  UNKNOWN = '<unknown>',
  STDIO = 'stdio',
  TCP = 'tcp',
}

export interface IConnectionConfiguration {
  type: ConnectionType;
  protocol: ProtocolType;
  puppetBaseDir: string;
  puppetDir: string;
  languageServerPath: string;
  rubydir: string;
  rubylib: string;
  environmentPath: string;
  sslCertFile: string;
  sslCertDir: string;

  pdkBinDir:string;
  pdkRubyLib:string;
  pdkRubyVerDir:string;
  pdkGemDir:string;
  pdkRubyDir:string;
  pdkRubyBinDir:string;
  pdkGemVerDir:string; 
}

export enum PuppetInstallType{
  PDK    = "pdk",
  PUPPET = "agent",
}
