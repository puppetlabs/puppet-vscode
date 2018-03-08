# Change Log

All notable changes to the "vscode-puppet" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Unreleased

- ([GH-225](https://github.com/jpogran/puppet-vscode/issues/225)) Readd Local Workspace comand line option

## 0.9.0 - 2018-02-01

- ([GH-50](https://github.com/jpogran/puppet-vscode/issues/50)) Add document formatter for puppet-lint
- ([GH-204](https://github.com/jpogran/puppet-vscode/issues/204)) Fix debug server for Puppet 4.x

## 0.8.0 - 2017-11-24

- ([GH-180](https://github.com/jpogran/puppet-vscode/issues/180)) Backslashes in File Path do not display in Node Graph
- ([GH-100](https://github.com/jpogran/puppet-vscode/issues/100)) Experimental Puppet-Debugger
- ([PR-194](https://github.com/jpogran/puppet-vscode/pull/194)) Fix logger in PDK New Task
- ([PR-195](https://github.com/jpogran/puppet-vscode/pull/195)) Do not error in validation exception handler
- ([GH-187](https://github.com/jpogran/puppet-vscode/issues/187)) Add stdio mode to language server
- (maint) Fix rubocop violations

## 0.7.2 - 2017-11-01

- ([GH-165](https://github.com/jpogran/puppet-vscode/issues/165)) Broken readme link
- ([GH-88](https://github.com/jpogran/puppet-vscode/issues/88))  Rework Node Graph Preview to use local svg
- ([GH-154](https://github.com/jpogran/puppet-vscode/issues/154)) Use hosted JSON schema files
- ([GH-169](https://github.com/jpogran/puppet-vscode/issues/169)) Fix bug in sytanx highlighting
- ([GH-167](https://github.com/jpogran/puppet-vscode/issues/167)) Add PDK New Task command
- ([GH-156](https://github.com/jpogran/puppet-vscode/issues/156)) Document restarting Puppet extension command
- ([GH-177](https://github.com/jpogran/puppet-vscode/issues/177)) Remove detection of Puppet VERSION file
- ([GH-175](https://github.com/jpogran/puppet-vscode/issues/175)) Fix 'could not find valid version of Puppet'

## 0.7.1 - 2017-09-29

- ([GH-157](https://github.com/jpogran/puppet-vscode/issues/157)) Puppet Resource command hidden

## 0.7.0 - 2017-09-22

- ([GH-115](https://github.com/jpogran/puppet-vscode/issues/115)) Add Puppet Development Kit (PDK) integration
- ([GH-136](https://github.com/jpogran/puppet-vscode/issues/136)) Create a better UI experience while Puppet loads
- ([GH-61](https://github.com/jpogran/puppet-vscode/issues/61))  Create a better experience when language client fails
- ([GH-135](https://github.com/jpogran/puppet-vscode/issues/135)) Fix incorrect logger when a client error occurs
- ([GH-129](https://github.com/jpogran/puppet-vscode/issues/129)) Honor inline puppet lint directives
- ([GH-133](https://github.com/jpogran/puppet-vscode/issues/133)) Fix issue with puppet 5.1.0
- ([GH-122](https://github.com/jpogran/puppet-vscode/issues/122)) Show upgrade message with changelog
- ([GH-120](https://github.com/jpogran/puppet-vscode/issues/120)) Allow custom Puppet agent installation directory
- ([GH-126](https://github.com/jpogran/puppet-vscode/issues/126)) Fix completion provider with Puppet 5.2.0
- ([GH-110](https://github.com/jpogran/puppet-vscode/issues/110)) Add extension analytics
- ([GH-138](https://github.com/jpogran/puppet-vscode/issues/138)) Set extension analytics to prod
- ([GH-109](https://github.com/jpogran/puppet-vscode/issues/109)) Randomize languageserver port
- ([GH-111](https://github.com/jpogran/puppet-vscode/issues/111)) Parse puppet-lint.rc in module directory

## 0.6.0 - 2017-08-08

- Fix packaging error where language server was not included

## 0.5.3 - 2017-08-08

- ([GH-92](https://github.com/jpogran/puppet-vscode/issues/92)) Added context menus for Puppet Resource and Nodegraph preview
- ([GH-98](https://github.com/jpogran/puppet-vscode/issues/98)) Improve language server function and type loading
- ([GH-52](https://github.com/jpogran/puppet-vscode/issues/52)) JSON validation and schema for metadata.json
- ([GH-47](https://github.com/jpogran/puppet-vscode/issues/47)) Fixes pending language server tests
- ([GH-45](https://github.com/jpogran/puppet-vscode/issues/45)) Fix runocop violations for language tcp server
- ([GH-89](https://github.com/jpogran/puppet-vscode/issues/89)) Document support for linux in readme
- ([GH-64](https://github.com/jpogran/puppet-vscode/issues/64)) Additional language server tests
- ([GH-103](https://github.com/jpogran/puppet-vscode/issues/103)) Extension now supports puppet-lint rc files
- ([GH-99](https://github.com/jpogran/puppet-vscode/issues/99)) Improved client README and Gallery page

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
