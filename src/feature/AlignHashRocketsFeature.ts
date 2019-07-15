import { IFeature } from '../feature';
import * as vscode from "vscode";
import { ILogger } from "../logging";
import { IAggregateConfiguration } from "../configuration";

class HashRocketLocation {
  public rocketIndex: number;
  public preceedingTextIndex: number;
}

class AlignHashRocketsFormatter implements vscode.OnTypeFormattingEditProvider{
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  private extractHashRocketLocation(document: vscode.TextDocument, line: number): HashRocketLocation {
    if (line < 0 || line > document.lineCount) { return null; }

    var textLine = document.lineAt(line);
    // Find the first hash-rocket `=>`
    var hashRocket = textLine.text.indexOf(' =>');
    if (hashRocket === -1) { return null; }

    // Now find where the preceeding text ends
    var textIndex = textLine.text.substr(0, hashRocket).trimRight().length;
    //        key    => value 
    //           |  | <--- this is hashRocket
    //           | <--- this is textIndex
    var result: HashRocketLocation = {
      rocketIndex: hashRocket + 1,
      preceedingTextIndex: textIndex
    };

    return result;
  }

  public provideOnTypeFormattingEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    ch: string,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken):
    Thenable<vscode.TextEdit[]>
  {
    //TODO: Check options for tabs vs spaces

    // Check if we're at the end of an expected hash rocket
    if (document.getText(new vscode.Range(position.line, position.character - 3, position.line, position.character)) !== ' =>') {
      return null;
    }

    var logger = this.logger;
    var extractor = this.extractHashRocketLocation;

    return new Promise<vscode.TextEdit[]>(function (resolve) {
      var result: vscode.TextEdit[] = [];
      var rocketLocations: Map<number, HashRocketLocation> = new Map<number, HashRocketLocation>();
      // Get the hash rocket location for the current position
      var location = extractor(document, position.line);
      // If we couldn't find one, or it's different towhat we expect, pull the ripcord!
      if (location === null) { return null; }
      if (location.rocketIndex !== position.character - 2) { return null; } // -2 becuase we need to go back the two characters in the hash rocket
      rocketLocations.set(position.line, location);

      // Find the hash rocket lines after this one
      var lineNum = position.line;
      do {
        lineNum--;
        location = extractor(document, lineNum);
        if (location !== null) { rocketLocations.set(lineNum, location); }
      } while (location !== null);

      // Find the hash rocket lines before this one
      lineNum = position.line;
      do {
        lineNum++;
        location = extractor(document, lineNum);
        if (location !== null) { rocketLocations.set(lineNum, location); }
      } while (location !== null);

      // Find the largest preceeding text and then add 1, this is where the hash rocket _should_ be.
      var correctIndex:number = -1;
      rocketLocations.forEach( (value) => {
        if (value.preceedingTextIndex > correctIndex) { correctIndex = value.preceedingTextIndex; }
      });
      correctIndex++;

      // Construct required TextEdits
      rocketLocations.forEach((value, key) => {
        // Only create a TextEdit if the hash rocket is in the wrong location
        if (value.rocketIndex !== correctIndex) {
          var te = new vscode.TextEdit(
            new vscode.Range(key, value.preceedingTextIndex, key, value.rocketIndex),
            ' '.repeat(correctIndex - value.preceedingTextIndex)
          );
          logger.debug(`[${key}] = ` + JSON.stringify(value));
          result.push(te);
        }
      });
      resolve(result);
    });
  }
}

export class AlignHashRocketsFeature implements IFeature {
  private provider: vscode.OnTypeFormattingEditProvider;

  constructor(
    langID: string,
    config: IAggregateConfiguration,
    context: vscode.ExtensionContext,
    logger: ILogger
  ) {
    // Check if the hashrocket feature flah has been set
    if (!config.workspace.editorService.featureFlags.includes('hashrocket')) { return; }
    this.provider = new AlignHashRocketsFormatter(logger);
    context.subscriptions.push(vscode.languages.registerOnTypeFormattingEditProvider(langID, this.provider, '>'));
    logger.debug("Registered On Type Formatting Edit provider");

  }

  public dispose(): any { return undefined; }
}
