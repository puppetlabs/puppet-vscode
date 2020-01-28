# Change Log

All notable changes to the "puppet-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.23.0] - 2020-01-31

### Added

- ([GH-213](https://github.com/lingua-pupuli/puppet-editor-services/issues/213)) [puppet-editor-services-0.24.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.24.0) Gather and use facts using sidecar

### Fixed

- ([GH-289](https://github.com/lingua-pupuli/puppet-vscode/issues/289)) Fix paramter indentation after type declaration
- ([GH-605](https://github.com/lingua-pupuli/puppet-vscode/issues/605)) Use correct setting name for module path
- ([GH-199](https://github.com/lingua-pupuli/puppet-editor-services/issues/199)) [puppet-editor-services-0.24.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.24.0) Update stack trace tests for Puppet 5.5.18

## [0.22.0] - 2019-12-20

### Added

- ([GH-592](https://github.com/lingua-pupuli/puppet-vscode/issues/592)) Add Puppetfile resolver in Puppet-Editor-Services
- ([GH-588](https://github.com/lingua-pupuli/puppet-vscode/issues/588)) Add server telemetry pass through
- ([GH-198](https://github.com/lingua-pupuli/puppet-editor-services/issues/198)) [puppet-editor-services-0.23.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.23.0) Added the Puppetfile Resolver for more in-depth Puppetfile validation
- ([GH-94](https://github.com/lingua-pupuli/puppet-editor-services/issues/94)) [puppet-editor-services-0.23.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.23.0) Added better intellisense when inside Bolt plans

### Changed

- ([Commit](https://github.com/lingua-pupuli/puppet-vscode/commit/dd47821c56f9d984f428899c4dbfd982a2731206)) Sends PDK version telemetry on start
- ([Commit](https://github.com/lingua-pupuli/puppet-vscode/commit/3464a3cc94ee8b972b7d7673fc3ee42fa874e39f)) Update telemetry to v0.1.2
- ([GH-592](https://github.com/lingua-pupuli/puppet-vscode/issues/592)) Update Editor Services to version 0.23.0
- ([GH-193](https://github.com/lingua-pupuli/puppet-editor-services/issues/193)) [puppet-editor-services-0.23.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.23.0) Refactor the TCP and STDIO servers, protocols and handlers
- ([Commit](https://github.com/lingua-pupuli/puppet-editor-services/commit/c3bd86f5b9a237b92f4c0e2d6c2ddc7aa5b0d9e5)) [puppet-editor-services-0.23.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.23.0) Update puppet-lint to version 2.4.2

### Fixed

- ([GH-579](https://github.com/lingua-pupuli/puppet-vscode/issues/579)) Fix build script extract path
- ([GH-199](https://github.com/lingua-pupuli/puppet-editor-services/issues/199)) [puppet-editor-services-0.23.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.23.0) Fixes for Puppet 6.11.0
- ([GH-139](https://github.com/lingua-pupuli/puppet-editor-services/issues/139)) [puppet-editor-services-0.23.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.23.0) Provide completions for defined types

### Removed

- ([GH-585](https://github.com/lingua-pupuli/puppet-vscode/issues/585)) Remove deprecated settings

## [0.21.0] - 2019-09-30

### Added

- ([GH-181](https://github.com/lingua-pupuli/puppet-editor-services/issues/181)) [puppet-editor-services-0.22.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.22.0) Added completion for resource-like class ([Julio Sueiras](https://github.com/juliosueiras))
- ([GH-177](https://github.com/lingua-pupuli/puppet-editor-services/issues/177)) [puppet-editor-services-0.22.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.22.0) Add auto-align hash rocket formatter
- ([GH-174](https://github.com/lingua-pupuli/puppet-editor-services/issues/174)) [puppet-editor-services-0.22.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.22.0) Understand Puppet Data Types and hover provider support

### Changed

- (maint) Convert gulp build script to psake

### Fixed

- ([GH-169](https://github.com/lingua-pupuli/puppet-editor-services/issues/169)) [puppet-editor-services-0.22.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.22.0) Respond to protocol dependant messages correctly
- ([GH-48](https://github.com/lingua-pupuli/puppet-editor-syntax/issues/48)) [puppet-editor-syntax-1.3.4](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.4) Correctly tokenise if-else

### Removed

- ([GH-557](https://github.com/lingua-pupuli/puppet-vscode/issues/557)) Remove Docker Connection Handler

## [0.20.0] - 2019-08-30

### Added

- ([GH-2](https://github.com/lingua-pupuli/docs/issues/2)) [docs-0.1.0](https://github.com/lingua-pupuli/docs/releases/tag/0.1.0) Puppet VSCode Website v1
- ([GH-534](https://github.com/lingua-pupuli/puppet-vscode/issues/534)) Puppet Module Metadata hover provider
- ([GH-541](https://github.com/lingua-pupuli/puppet-vscode/issues/541)) Check for latest PDK version and notify

### Changed

- ([GH-546](https://github.com/lingua-pupuli/puppet-vscode/issues/546)) Update Puppet DAG svg icon
- ([GH-55](https://github.com/lingua-pupuli/puppet-editor-services/issues/55)) [puppet-editor-services-0.21.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.21.0) Allow Debug Server to work with Puppet 6
- ([GH-106](https://github.com/lingua-pupuli/puppet-editor-services/issues/106)) [puppet-editor-services-0.21.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.21.0) Update puppet-lint to 2.3.6

### Fixed

- ([GH-43](https://github.com/lingua-pupuli/puppet-editor-syntax/issues/43)) [puppet-editor-syntax-1.3.3](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.3) Fix syntax highlighting for resource references and chain arrows
- ([GH-34](https://github.com/lingua-pupuli/puppet-editor-syntax/issues/34)) [puppet-editor-syntax-1.3.3](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.3) Comments in hashes should tokenize

### Deprecated

- (maint) Puppet Docker Protocol deprecated in favor of Microsoft Remote Container Extension

## [0.19.0] - 2019-07-19

### Changed

- ([GH-530](https://github.com/lingua-pupuli/puppet-vscode/issues/530)) Enable extension with Puppet workspace files
- ([GH-141](https://github.com/lingua-pupuli/puppet-editor-services/issues/141)) [puppet-editor-services-0.20.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.20.0) Load all Puppet 4 API Features
- ([GH-137](https://github.com/lingua-pupuli/puppet-editor-services/issues/137)) [puppet-editor-services-0.20.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.20.0) Load Puppet 4 Custom Types, Defined Types and Classes
- ([GH-121](https://github.com/lingua-pupuli/puppet-editor-services/issues/121)) [puppet-editor-services-0.20.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.20.0) Load Puppet 4 Functions and Puppet 3 Functions

### Fixed

- ([GH-128](https://github.com/lingua-pupuli/puppet-editor-services/issues/128)) [puppet-editor-services-0.20.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.20.0) Detect Puppet Plan files correctly
- ([GH-147](https://github.com/lingua-pupuli/puppet-editor-services/issues/147)) [puppet-editor-services-0.20.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.20.0) Gracefully fail on LoadError when compiling manifests

## [0.18.1] - 2019-06-07

### Added

- ([GH-505](https://github.com/lingua-pupuli/puppet-vscode/issues/505)) Add hide `PDK New Module` titlebar button
- ([GH-507](https://github.com/lingua-pupuli/puppet-vscode/issues/507))([GH-508](https://github.com/lingua-pupuli/puppet-vscode/issues/508)) Document Puppet Version Support

### Changed

- ([GH-502](https://github.com/lingua-pupuli/puppet-vscode/issues/502)) Switch default PuppetInstallType to PDK rather than the agent
- ([GH-502](https://github.com/lingua-pupuli/puppet-vscode/issues/502)) Automatically determine PuppetInstallType
- ([GH-499](https://github.com/lingua-pupuli/puppet-vscode/issues/499)) Add setting to allow disabling editor services

### Fixed

- ([GH-436](https://github.com/lingua-pupuli/puppet-vscode/issues/436)) Fix extension "crash" after editing line of code
- ([GH-132](https://github.com/lingua-pupuli/puppet-editor-services/issues/132)) [puppet-editor-services-0.19.1](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.19.1) Suppress \$stdout usage for STDIO transport
- ([GH-118](https://github.com/lingua-pupuli/puppet-editor-services/issues/118)) [puppet-editor-services-0.19.1](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.19.1) Fail gracefully when critical gems cannot load
- ([GH-39](https://github.com/lingua-pupuli/puppet-editor-syntax/issues/39)) [puppet-editor-syntax-1.3.2](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.2) Node definitions can only be strings
- ([GH-38](https://github.com/lingua-pupuli/puppet-editor-syntax/issues/38)) [puppet-editor-syntax-1.3.2](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.2) Fix highlighting of classes and functions
- ([GH-37](https://github.com/lingua-pupuli/puppet-editor-syntax/issues/37)) [puppet-editor-syntax-1.3.2](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.2) Tokenise variables within arrays
- ([GH-32](https://github.com/lingua-pupuli/puppet-editor-syntax/issues/32)) [puppet-editor-syntax-1.3.2](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.2) Highlight resource names and titles correctly
- ([GH-30](https://github.com/lingua-pupuli/puppet-editor-syntax/issues/30)) [puppet-editor-syntax-1.3.2](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.2) Highlight regex capture variables

## [0.18.0] - 2019-03-29

### Added

- ([GH-494](https://github.com/lingua-pupuli/puppet-vscode/issues/494)) Add Progress Bar for long lived operations
- ([GH-489](https://github.com/lingua-pupuli/puppet-vscode/issues/489)) Allow users to change puppet version used by editor services in PDK

### Changed

- ([Commit](https://github.com/lingua-pupuli/puppet-vscode/commit/8b2815ad06f7b3f82574c44684387007c5213f5d)) Update puppet-editor-syntax to [1.3.1](https://github.com/lingua-pupuli/puppet-editor-syntax/releases/tag/1.3.1)
- ([GH-489](https://github.com/lingua-pupuli/puppet-vscode/issues/489)) Update puppet-editor-services to [0.19.0](https://github.com/lingua-pupuli/puppet-editor-services/blob/master/CHANGELOG.md#0190---2019-03-24)

## [0.17.0] - 2019-02-14

### Added

- ([GH-476](https://github.com/lingua-pupuli/puppet-vscode/issues/476)) Add Bolt commands
- ([GH-477](https://github.com/lingua-pupuli/puppet-vscode/issues/477)) Add Bolt yaml snippets

### Fixed

- ([GH-480](https://github.com/lingua-pupuli/puppet-vscode/issues/480)) Automatically find Ruby version from PDK

### Changed

- ([GH-478](https://github.com/lingua-pupuli/puppet-vscode/issues/478)) Update puppet-editor-services to [0.18.0](https://github.com/lingua-pupuli/puppet-editor-services/blob/master/CHANGELOG.md#0180---2019-02-05)

## [0.16.0] - 2019-01-25

### Added

- ([GH-375](https://github.com/lingua-pupuli/puppet-vscode/issues/375)) Support starting Language Server in Docker container
- ([GH-295](https://github.com/lingua-pupuli/puppet-vscode/issues/295)) Add Puppetfile as a contributing langauge

### Changed

- ([GH-459](https://github.com/lingua-pupuli/puppet-vscode/issues/459)) Update extension for new Debugging API

### Fixed

- ([GH-453](https://github.com/lingua-pupuli/puppet-vscode/issues/453)) Language Server will not start

## [0.15.1] - 2019-01-09

### Fixed

- ([GH-454](https://github.com/lingua-pupuli/puppet-vscode/issues/454)) Fix Ruby path for PDK 1.8.0

## [0.15.0] - 2018-12-21

### Added

- ([GH-440](https://github.com/lingua-pupuli/puppet-vscode/issues/440)) Add a setting for additional modulepath
- ([GH-335](https://github.com/lingua-pupuli/puppet-vscode/issues/335)) Add a setting to disable the language server

### Changed

- ([GH-447](https://github.com/lingua-pupuli/puppet-vscode/issues/447)) Update puppet-editor-services to [0.17.0](https://github.com/lingua-pupuli/puppet-editor-services/blob/master/CHANGELOG.md#0170---2018-12-14)
- ([GH-412](https://github.com/lingua-pupuli/puppet-vscode/issues/412)) Refactored the Language Server Connection Handler

### Removed

- ([GH-446](https://github.com/lingua-pupuli/puppet-vscode/issues/446)) Remove deprecated --enable-file-cache option for Editor Services
- ([GH-439](https://github.com/lingua-pupuli/puppet-vscode/issues/439)) Remove RestartSession Command

## [0.14.0] - 2018-12-03

### Changed

- ([GH-431](https://github.com/lingua-pupuli/puppet-vscode/issues/431)) Update Editor Syntax to [1.3.0](https://github.com/lingua-pupuli/puppet-editor-syntax/blob/master/CHANGELOG.md#130---2018-11-29)
- ([GH-427](https://github.com/lingua-pupuli/puppet-vscode/issues/427)) Update Editor Syntax to [1.2.0](https://github.com/lingua-pupuli/puppet-editor-syntax/blob/master/CHANGELOG.md#120---2018-11-27)
- ([GH-434](https://github.com/lingua-pupuli/puppet-vscode/issues/434)) Update puppet-editor-services to [0.16.0](https://github.com/lingua-pupuli/puppet-editor-services/blob/master/CHANGELOG.md#0160---2018-11-30)
- ([GH-422](https://github.com/lingua-pupuli/puppet-vscode/issues/422)) Upgrade to VS Code's webview API

## [0.13.2] - 2018-10-31

### Added

- ([GH-419](https://github.com/lingua-pupuli/puppet-vscode/issues/419)) Update puppet-editor-services to 0.15.1 release

## [0.13.1] - 2018-10-30

### Added

- ([GH-416](https://github.com/lingua-pupuli/puppet-vscode/issues/416)) Update syntax file with 0.1.0 puppet-editor-syntax 0.1.0 release

### Fixed

- ([GH-331](https://github.com/lingua-pupuli/puppet-vscode/issues/331)) Go to definition not working

## [0.13.0] - 2018-10-23

### Added

- ([GH-366](https://github.com/lingua-pupuli/puppet-vscode/issues/366)) New Debug Adapter
- ([GH-354](https://github.com/lingua-pupuli/puppet-vscode/issues/354)) Document PDK as source information
- ([GH-385](https://github.com/lingua-pupuli/puppet-vscode/issues/385)) New Outline View, Breadcrumb, and Go to Symbol Features

### Changed

- ([GH-397](https://github.com/lingua-pupuli/puppet-vscode/issues/397)) Updated Puppet Editor Services to version 0.15.0. Change Log is at [https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.15.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.15.0)
- ([GH-373](https://github.com/lingua-pupuli/puppet-vscode/issues/373)) Refactor commands and providers to features
- ([GH-351](https://github.com/lingua-pupuli/puppet-vscode/issues/351)) Updated Puppet Editor Services to version 0.14.0. Change Log is at [https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.14.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.15.0)
- ([GH-323](https://github.com/lingua-pupuli/puppet-vscode/issues/323)) Update readme with gif examples
- ([GH-399](https://github.com/lingua-pupuli/puppet-vscode/issues/399)) Update Puppet loading UI to be more user friendly
- ([GH-405](https://github.com/lingua-pupuli/puppet-vscode/issues/405)) Update readme with correct links into the readme

### Deprecated

- ([GH-315](https://github.com/lingua-pupuli/puppet-vscode/issues/315)) Deprecate puppetAgentDir setting

## [0.12.0] - 2018-08-24

### Added

- ([GH-315](https://github.com/lingua-pupuli/puppet-vscode/issues/315)) Add PDK as source in addition to Puppet-Agent
- ([GH-355](https://github.com/lingua-pupuli/puppet-vscode/issues/355)) Re-add base telemetry

### Changed

- ([GH-327](https://github.com/lingua-pupuli/puppet-vscode/issues/327)) Updated Puppet Editor Services to version 0.13.0. Change Log is at [https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.13.0](https://github.com/lingua-pupuli/puppet-editor-services/releases/tag/0.13.0)
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
- ([GH-307](https://github.com/lingua-pupuli/puppet-vscode/issues/307)) Fix Path resolution on mac and \*nix.
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
- ([GH-61](https://github.com/lingua-pupuli/puppet-vscode/issues/61)) Create a better experience when language client fails.
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

[Unreleased]: https://github.com/lingua-pupuli/puppet-vscode/compare/0.22.0...master
[0.22.0]: https://github.com/lingua-pupuli/puppet-vscode/compare/0.21.0...0.22.0
[0.21.0]: https://github.com/lingua-pupuli/puppet-vscode/compare/0.20.0...0.21.0
[0.20.0]: https://github.com/lingua-pupuli/puppet-vscode/compare/0.19.0...0.20.0
[0.19.0]: https://github.com/lingua-pupuli/puppet-vscode/compare/0.18.0...0.19.0
[0.18.0]: https://github.com/lingua-pupuli/puppet-vscode/compare/0.17.0...0.18.0
[0.17.0]: https://github.com/lingua-pupuli/puppet-vscode/compare/0.16.0...0.17.0
[0.16.0]: https://github.com/lingua-pupuli/puppet-vscode/compare/0.15.1...0.16.0
