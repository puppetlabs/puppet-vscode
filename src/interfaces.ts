'use strict';

// Only add simple interfaces here. No import's allowed
/* eslint-disable @typescript-eslint/naming-convention */
export enum ConnectionStatus {
  NotStarted,
  Starting,
  RunningLoading,
  RunningLoaded,
  Stopping,
  Failed,
  Stopped,
  Initializing,
  InitializationComplete,
}
