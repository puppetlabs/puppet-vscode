# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the official **Puppet extension for Visual Studio Code** — a TypeScript VSCode extension client. It does *not* contain the Puppet language intelligence itself; that lives in the [Puppet Editor Services](https://github.com/puppetlabs/puppet-editor-services) language server (Ruby), which is downloaded and bundled at build time ("vendored"). This repo is primarily a Language Server Protocol (LSP) client plus VSCode-specific features (commands, views, debugging, status bar).

## Build & Development

The build is driven by **psake** (PowerShell), not plain npm. PowerShell (`pwsh`) and the `psake` module are required. The npm `build`/`watch` scripts shell out to `build.ps1`.

```bash
npm install                        # install node deps
npm run build                      # full build: npm install + vendor + tsc (via build.ps1 -> psakefile.ps1)
npm run compile                    # TypeScript compile only (tsc -p ./), output to ./out
npm run watch                      # build once, then tsc -watch
./build.ps1 -task clean,vendor     # re-download the language server + syntax (see Vendoring below)
```

To run/debug the extension interactively: open the repo in VSCode and press **F5** (launches an Extension Development Host). Vendored resources must exist first (`./build.ps1 -task vendor`).

## Lint, Format, Test

```bash
npm run lint            # eslint --ext .ts src
npm run fix             # eslint --fix
npm run format          # prettier --write on **/*.{ts,js,json}
npm test                # compiles, then runs integration tests in a headless VSCode (out/test/runtest.js)
npm run test:coverage   # same, with nyc/lcov coverage
```

Tests are **VSCode integration tests** (Mocha, `tdd` UI, chai + sinon), launched via `@vscode/test-electron` which downloads a real VSCode and runs the suite inside it — there is no pure-unit `mocha` runner. [src/test/runtest.ts](src/test/runtest.ts) is the entry point; [src/test/suite/index.ts](src/test/suite/index.ts) globs `**/*.test.js` from the compiled `out/test` dir. Because tests run compiled JS, **you must `npm run compile` (or `npm test` which does it via `pretest`) before test changes take effect.** There is no built-in single-test filter in the npm scripts; narrow runs by temporarily using Mocha's `.only` or commenting the glob.

Note: many tests resolve a real PDK/Puppet install path; CI installs the PDK on each OS before running (see [.github/workflows/vscode-ci.yml](.github/workflows/vscode-ci.yml)). The full suite is run across Linux/Windows/macOS.

## Vendoring (important architecture detail)

The language server and syntax grammar are **not committed** — they are fetched into `vendor/` during the build. [psakefile.ps1](psakefile.ps1) reads the `editorComponents` block in [package.json](package.json) to decide what to fetch:

- `editorServices.release` / `editorSyntax.release` — download a tagged GitHub release (default).
- `githubref` / `githubuser` / `githubrepo` — fetch from a specific repo/branch instead.
- `directory` — copy from a local checkout (useful when developing the language server alongside this extension).

The `VendorEditorServices` / `VendorEditorSyntax` tasks have preconditions that skip if `vendor/languageserver` or `syntaxes/puppet.tmLanguage` already exist, so run `clean` first to force a refresh. See [README_BUILD.md](README_BUILD.md) for all options. Cytoscape (used by the node graph) is also vendored from `node_modules`.

## Code Architecture

The extension entry point is [src/extension.ts](src/extension.ts) (`activate`/`deactivate`). Activation flow:

1. Reads VSCode workspace settings → `ISettings` ([src/settings.ts](src/settings.ts)), warns on legacy/deprecated settings.
2. Builds an **`IAggregateConfiguration`** ([src/configuration.ts](src/configuration.ts)) — this resolves the abstract settings into concrete paths: which Puppet install to use (PDK vs Agent, `auto`-detected), Ruby dirs, RUBYLIB/PATH env, SSL paths, and PDK Ruby instance discovery ([src/configuration/pdkResolver.ts](src/configuration/pdkResolver.ts), [src/configuration/pathResolver.ts](src/configuration/pathResolver.ts)). This is the single source of truth for "how do I invoke the bundled Ruby".
3. Constructs a list of **Features** and a **ConnectionHandler**.

### Features

Every discrete capability is an `IFeature` (a `vscode.Disposable`, [src/feature.ts](src/feature.ts)). They live in [src/feature/](src/feature/) and are instantiated into `extensionFeatures[]` in `activate()`, then all disposed in `deactivate()`. To add a capability, create a new `IFeature` and push it onto that array. Examples: `PDKFeature` (PDK commands), `DebuggingFeature`, `FormatDocumentFeature`, `PuppetNodeGraphFeature`, `PuppetStatusBarFeature`, the Puppetfile hover/completion features.

### ConnectionHandler (LSP client)

[src/handler.ts](src/handler.ts) defines the abstract `ConnectionHandler` wrapping a `vscode-languageclient` `LanguageClient`. Two concrete subclasses choose the transport based on `puppet.editorService.protocol`:

- [src/handlers/stdio.ts](src/handlers/stdio.ts) — `StdioConnectionHandler` (default): spawns the bundled `puppet-languageserver` Ruby process over stdio.
- [src/handlers/tcp.ts](src/handlers/tcp.ts) — `TcpConnectionHandler`: connects to a local or remote editor services over TCP.

The handler starts the client, listens for telemetry, and polls `PuppetVersionRequest` to drive the status bar ("Loading facts/functions/types/classes…"). Custom LSP message types are in [src/messages.ts](src/messages.ts).

### Views & other layers

- [src/views/](src/views/) — `TreeDataProvider`s for the Puppet activity-bar toolbar (Facts, Puppetfile). Registered at the end of `activate()`.
- [src/logging/](src/logging/) — `ILogger` implementations (output channel, file, stdout, null).
- [src/telemetry.ts](src/telemetry.ts) — Application Insights reporter (`reporter`); only command names/config are collected, never file contents.
- [src/forge.ts](src/forge.ts) — Puppet Forge API calls (e.g. latest PDK version check, module hover info) via axios.

### contributes (package.json)

Commands, menus, language definitions (`puppet`, `puppetfile`), grammars, snippets, the debugger type, the activity-bar view container, and all `puppet.*` configuration settings are declared in the `contributes` block of [package.json](package.json). When adding a command, register it in both `contributes.commands` and the relevant menu group, and wire its handler in a feature.

## Conventions

- TypeScript is compiled non-strict (`strict: false` in [tsconfig.json](tsconfig.json)); target es6/commonjs, output to `out/`.
- ESLint uses `@typescript-eslint` with `prettier`; run `npm run fix` before committing.
- Commit messages: first line ≤50 chars, imperative mood, prefixed with the GitHub issue as `(GH-XXXX) message` (see [CONTRIBUTING.md](CONTRIBUTING.md)). Branch naming: `GH-1234-short_description`.
- The two language IDs (`puppet`, `puppetfile`) and the debugger type (`Puppet`) are hardcoded constants in [src/extension.ts](src/extension.ts) and must not change.

## Hard Constraints

- At the start of a coding session, review the repository structure and any relevant README or documentation files to understand the area you are working in.
- Always read the files relevant to the task before suggesting or making a change.
- Never merge a pull request.
- Never work directly on the `main` or `master` branch.
- Never push a branch without explicit instruction.
- Never delete a file without permission — this applies even after a blanket "yes to all".
- Never output, log, save, or hardcode security-sensitive values — this includes passwords, tokens, API keys, private keys, secrets, and credentials of any kind. Do not write them to files, include them in commit messages, or print them in responses.
