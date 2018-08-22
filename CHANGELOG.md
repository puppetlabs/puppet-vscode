# Change Log

All notable changes to the "vscode-puppet" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Unreleased

## [0.11.1] - 2018-08-24

### Added

- ([GH-317](https://github.com/lingua-pupuli/puppet-vscode/issues/317)) Add PDK as source in addition to Puppet-Agent
- ([GH-355](https://github.com/lingua-pupuli/puppet-vscode/issues/355)) Re-add base telemetry

### Changed

- ([GH-327](https://github.com/lingua-pupuli/puppet-vscode/issues/327)) Updated Puppet Editor Services to version 0.13.0.  Change Log is at [https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.13.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.13.0)
- ([GH-316](https://github.com/lingua-pupuli/puppet-vscode/issues/316)) Conform to Keep-A-Changelog format in CHANGELOG

### Fixed

- ([GH-320](https://github.com/lingua-pupuli/puppet-vscode/issues/320)) Fix `if/else` snippet.
- ([GH-343](https://github.com/lingua-pupuli/puppet-vscode/issues/343)) Fix process environment builder for LanguageServer
- ([GH-317](https://github.com/lingua-pupuli/puppet-vscode/issues/317)) Fix extension test harness and add Windows, Linux, and Mac tests

## [0.11.0] - 2018-07-16

### Added

- ([GH-284](https://github.com/lingua-pupuli/puppet-vscode/issues/284)) Add support for region folding.
- ([GH-238](https://github.com/lingua-pupuli/puppet-vscode/issues/238)) Add stdio support to client extension.
- ([GH-240](https://github.com/lingua-pupuli/puppet-vscode/issues/240)) Add TCP retry functionality.
- (maint) Automatically download languageserver on build and watch.

### Changed

- Update Puppet Editor Services to `0.12.0`.
- ([GH-258](https://github.com/lingua-pupuli/puppet-vscode/issues/258)) Changed the vendoring process for editor services due to org move.
- ([GH-275](https://github.com/lingua-pupuli/puppet-vscode/issues/275)) Update the Marketplace categories.
- (maint) Improve issue templates.

### Fixed

- ([GH-252](https://github.com/lingua-pupuli/puppet-vscode/issues/252)) Update the README for org move.
- ([GH-289](https://github.com/lingua-pupuli/puppet-vscode/issues/289)) Fix Autoindenting for DSL.
- ([GH-301](https://github.com/lingua-pupuli/puppet-vscode/issues/301)) Fail fast if Puppet Agent is not installed.
- ([GH-310](https://github.com/lingua-pupuli/puppet-vscode/issues/310)) Fix gulp bump.
- ([GH-307](https://github.com/lingua-pupuli/puppet-vscode/issues/307)) Fix Path resolution on mac and *nix.
- ([GH-241](https://github.com/lingua-pupuli/puppet-vscode/issues/241)) Ensure specified tcp port is honored.
- ([GH-296](https://github.com/lingua-pupuli/puppet-vscode/issues/296)) Ensure document file scheme is set.
- (maint) Fix tslint errors.
- (maint) Update GitHub links for org change.
- (maint) Update Puppet grammar file.

### Removed

- ([GH-274](https://github.com/lingua-pupuli/puppet-vscode/issues/274)) Remove random tcp port resolution from client.

## [0.10.0] - 2018-03-29

### Added

- ([GH-236](https://github.com/lingua-pupuli/puppet-vscode/issues/236)) Add experimental file cache option.
- ([GH-225](https://github.com/lingua-pupuli/puppet-vscode/issues/225)) Add ability to read local workspace comand line option.
- ([GH-218](https://github.com/lingua-pupuli/puppet-vscode/issues/218)) Add support for validating EPP files.

### Changed

- ([GH-244](https://github.com/lingua-pupuli/puppet-vscode/issues/244)) Update puppet-lint to `2.3.5`.
- ([GH-216](https://github.com/lingua-pupuli/puppet-vscode/issues/216)) Improved syntax highlighting.
- ([GH-214](https://github.com/lingua-pupuli/puppet-vscode/issues/214)) Updated README for PDK `1.3.X`.
- ([GH-231](https://github.com/lingua-pupuli/puppet-vscode/issues/231)) Make document validation asynchronous.

#### Removed 

- ([GH-236](https://github.com/lingua-pupuli/puppet-vscode/issues/236)) Remove the preload option.

## [0.9.0] - 2018-02-01

### Added

- ([GH-50](https://github.com/lingua-pupuli/puppet-vscode/issues/50)) Add document formatter for puppet-lint.

### Fixed

- ([GH-204](https://github.com/lingua-pupuli/puppet-vscode/issues/204)) Fix debug server for Puppet `4.x`.

## [0.8.0] - 2017-11-24

### Added

- ([GH-100](https://github.com/lingua-pupuli/puppet-vscode/issues/100)) Added xperimental Puppet-Debugger.
- ([GH-187](https://github.com/lingua-pupuli/puppet-vscode/issues/187)) Add stdio mode to language server.

### Fixed

- ([GH-180](https://github.com/lingua-pupuli/puppet-vscode/issues/180)) Ensure Backslashes in File Path display in Node Graph.
- ([PR-194](https://github.com/lingua-pupuli/puppet-vscode/pull/194)) Fix logger in PDK New Task
- ([PR-195](https://github.com/lingua-pupuli/puppet-vscode/pull/195)) Do not error in validation exception handler.
- (maint) Fix rubocop violations.

## [0.7.2] - 2017-11-01

### Added
- ([GH-167](https://github.com/lingua-pupuli/puppet-vscode/issues/167)) Add PDK New Task command.
- ([GH-156](https://github.com/lingua-pupuli/puppet-vscode/issues/156)) Document restarting Puppet extension command.

### Changed
- ([GH-88](https://github.com/lingua-pupuli/puppet-vscode/issues/88)) Rework Node Graph Preview to use local svg instead of calling out to the internet.
- ([GH-154](https://github.com/lingua-pupuli/puppet-vscode/issues/154)) Use hosted JSON schema files instead of vendoring them.

### Fixed

- ([GH-165](https://github.com/lingua-pupuli/puppet-vscode/issues/165)) Fixed Broken README link.
- ([GH-169](https://github.com/lingua-pupuli/puppet-vscode/issues/169)) Fix bug in sytanx highlighting.
- ([GH-177](https://github.com/lingua-pupuli/puppet-vscode/issues/177)) Remove detection of Puppet VERSION file which was causing erroneous failures.
- ([GH-175](https://github.com/lingua-pupuli/puppet-vscode/issues/175)) Fix 'could not find valid version of Puppet'.

## [0.7.1] - 2017-09-29

### Fixed
- ([GH-157](https://github.com/lingua-pupuli/puppet-vscode/issues/157)) Unhide `Puppet Resource` command in the Command Palette.

## [0.7.0] - 2017-09-22

### Added

- ([GH-115](https://github.com/lingua-pupuli/puppet-vscode/issues/115)) Add Puppet Development Kit (PDK) integration.
- ([GH-136](https://github.com/lingua-pupuli/puppet-vscode/issues/136)) Create a better UI experience while Puppet loads.
- ([GH-61](https://github.com/lingua-pupuli/puppet-vscode/issues/61))  Create a better experience when language client fails.
- ([GH-122](https://github.com/lingua-pupuli/puppet-vscode/issues/122)) Show upgrade message with changelog.
- ([GH-120](https://github.com/lingua-pupuli/puppet-vscode/issues/120)) Allow custom Puppet agent installation directory.
- ([GH-111](https://github.com/lingua-pupuli/puppet-vscode/issues/111)) Parse `puppet-lint.rc` in module directory.

### Changed
- ([GH-109](https://github.com/lingua-pupuli/puppet-vscode/issues/109)) Randomize languageserver port.

### Fixed
- ([GH-135](https://github.com/lingua-pupuli/puppet-vscode/issues/135)) Fix incorrect logger when a client error occurs.
- ([GH-129](https://github.com/lingua-pupuli/puppet-vscode/issues/129)) Honor inline puppet lint directives.
- ([GH-133](https://github.com/lingua-pupuli/puppet-vscode/issues/133)) Fix issue with puppet 5.1.0.
- ([GH-126](https://github.com/lingua-pupuli/puppet-vscode/issues/126)) Fix completion provider with Puppet 5.2.0.



## [0.6.0] - 2017-08-08

### Fixed

- Fix packaging error where language server was not included.

## [0.5.3] - 2017-08-08

### Added

- ([GH-92](https://github.com/lingua-pupuli/puppet-vscode/issues/92)) Added context menus for Puppet Resource and Nodegraph preview.
- ([GH-52](https://github.com/lingua-pupuli/puppet-vscode/issues/52)) Added JSON validation and schema for `metadata.json`.
- ([GH-103](https://github.com/lingua-pupuli/puppet-vscode/issues/103)) Added support puppet-lint rc files.
- ([GH-89](https://github.com/lingua-pupuli/puppet-vscode/issues/89)) Documented support for Linux in README.

### Changed
- ([GH-99](https://github.com/lingua-pupuli/puppet-vscode/issues/99)) Improved client README and Gallery page.

### Fixed

- ([GH-98](https://github.com/lingua-pupuli/puppet-vscode/issues/98)) Fix language server function and type loading.

## [0.4.6] - 2017-06-29

### Changed

- Updated links in README.
- Added more information to package manifest.
- Minor updates to README.

## [0.4.5] - 2017-06-27

### Changed

- Updated badge link location in README.

## [0.4.2] - 2017-06-27

### Changed

- Updated badge links to use proper extension id.

## [0.4.0] - 2017-06-27

### Added

- Added a functional Language Server for the Puppet language with:
  - Real time `puppet lint`
  - Auto-complete and Hover support for many puppet language facets
  - Auto-complete and Hover support for facts
  - `puppet resource` support
  - Preview node graph support
- Extension can load a local Language Server if Puppet Agent is present on Windows, Mac and Linux.
- Implemented textDocument/didClose notification.

### Fixed

- Ensure Completion and Hover provider loads puppet modules.
- Fixed completion at file beginning on new lines and on keywords.

## [0.0.3] - 2017-05-08

### Added

- Added the Puppet Parser validate linter.

## [0.0.2] - 2017-05-04

### Added

- Added the Puppet Resource and Puppet Module commands.

## [0.0.1] - 2017-04-10

### Added

- Initial release of the puppet extension.
