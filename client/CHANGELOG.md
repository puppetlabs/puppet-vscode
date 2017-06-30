# Change Log

All notable changes to the "vscode-puppet" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Unreleased

- Added context menus for Puppet Resource and Nodegraph preview

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
