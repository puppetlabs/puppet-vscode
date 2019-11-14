declare module 'vscode-extension-telemetry' {
  export default class TelemetryReporter {
    constructor(extensionId: string, extensionVersion: string, key: string);
    sendTelemetryEvent(
      eventName: string,
      properties?: { [key: string]: string },
      measures?: { [key: string]: number }
    ): void;
    sendTelemetryException(
      error: Error,
      properties?: { [key: string]: string;},
      measurements?: { [key: string]: number; }
    ): void;
    dispose(); // tslint:disable-line
  }
}
