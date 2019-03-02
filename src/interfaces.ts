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
