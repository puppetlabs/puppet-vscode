# Change Log

All notable changes to the "vscode-puppet" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Unreleased

* Added support for the PDK(https://puppet.com/blog/develop-modules-faster-new-puppet-development-kit)
* Added telemetry to understand which parts Puppet users find useful. This will help us refine which commands we add in the future. We track whether the following commands are executed:
  * `puppet resource`
  * `pdk new module`
  * `pdk new class`
  * `pdk validate`
  * `pdk test unit`

> Please` note, you can turn off telemetry reporting for VS Code and all extensions through the ["telemetry.enableTelemetry": false setting](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## 0.6.0 - 2017-08-08

- Fix packaging error where language server was not included

## 0.5.3 - 2017-08-08

- (GH-92) Added context menus for Puppet Resource and Nodegraph preview
- (GH-98) Improve language server function and type loading
- (GH-52) JSON validation and schema for metadata.json
- (GH-47) Fixes pending language server tests
- (GH-45) Fix runocop violations for language tcp server
- (GH-89) Document support for linux in readme
- (GH-64) Additional language server tests
- (GH-103) Extension now supports puppet-lint rc files
- (GH-99) Improved client README and Gallery page

## 0.4.6 - 2017-06-29

### Changed

- Updated links in README
- Added more information to package manifest
- Minor updates to README

## 0.4.5 - 2017-06-27

### Changed

- Updated badge link location in README

## 0.4.2 - 2017-06-27

### Changed

- Updated badge links to use proper extension id

## 0.4.0 - 2017-06-27

### Added

- A functional Language Server for the Puppet language
  - Real time puppet lint
  - Auto-complete and Hover support for many puppet language facets
  - Auto-complete and Hover support for facts
  - 'puppet resource' support
  - Preview node graph support
- Extension can load a local Language Server if Puppet Agent is present on Windows, Mac and Linux
- Tested on older Puppet versions (4.7 LTS series)
- Added testing on Travis and Appveyor

### Fixed

- Completion and Hover provider didn't load puppet modules
- Implemented textDocument/didClose notification
- Extension building is functional and automated in a gulpfile
- Fixed completion at file beginning on new lines and on keywords

## 0.0.3 - 2017-05-08

### Added

- Puppet Parser validate linter added

## 0.0.2 - 2017-05-04

### Added

- Puppet Resource and Puppet Module commands.

## 0.0.1 - 2017-04-10

### Added

- Initial release of the puppet extension.
