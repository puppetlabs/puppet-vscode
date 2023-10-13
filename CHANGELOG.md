<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org).

## [v1.4.1](https://github.com/puppetlabs/puppet-vscode/tree/v1.4.1) - 2023-10-13

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/1.4.0...v1.4.1)

### Fixed

- (CAT-1491) - Fix broken forge urls in Puppetfile [#850](https://github.com/puppetlabs/puppet-vscode/pull/850) ([jordanbreen28](https://github.com/jordanbreen28))
- (GH-825) fix duplicate PDK terminals [#833](https://github.com/puppetlabs/puppet-vscode/pull/833) ([timidri](https://github.com/timidri))
- Detect suspended terminal on start [#820](https://github.com/puppetlabs/puppet-vscode/pull/820) ([jpogran](https://github.com/jpogran))

## [1.4.0](https://github.com/puppetlabs/puppet-vscode/tree/1.4.0) - 2021-10-13

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/1.3.0...1.4.0)

## [1.3.0](https://github.com/puppetlabs/puppet-vscode/tree/1.3.0) - 2021-06-08

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/1.2.0...1.3.0)

### Fixed

- (GH-748) Update settings for Editor Services 1.2.0 [#750](https://github.com/puppetlabs/puppet-vscode/pull/750) ([glennsarti](https://github.com/glennsarti))
- (GH-748) Update Editor Services to 1.2.0 [#749](https://github.com/puppetlabs/puppet-vscode/pull/749) ([glennsarti](https://github.com/glennsarti))

## [1.2.0](https://github.com/puppetlabs/puppet-vscode/tree/1.2.0) - 2021-04-05

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/1.1.0...1.2.0)

### Added

- (GH-732) Add additional PDK 2.0 functions: fact and function [#737](https://github.com/puppetlabs/puppet-vscode/pull/737) ([da-ar](https://github.com/da-ar))
- (GH-724) PDK New Module with Native window [#724](https://github.com/puppetlabs/puppet-vscode/pull/724) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-730) Fix ffi 1.14 libssp-0.dll missing with PDK 2.0 [#735](https://github.com/puppetlabs/puppet-vscode/pull/735) ([jpogran](https://github.com/jpogran))

## [1.1.0](https://github.com/puppetlabs/puppet-vscode/tree/1.1.0) - 2021-01-27

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/1.0.0...1.1.0)

### Fixed

- (GH-695) Add puppet.editorService.formatOnType.maxFileSize setting [#721](https://github.com/puppetlabs/puppet-vscode/pull/721) ([glennsarti](https://github.com/glennsarti))

## [1.0.0](https://github.com/puppetlabs/puppet-vscode/tree/1.0.0) - 2020-11-11

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.28.0...1.0.0)

### Added

- (GH-639) Remove Bolt commands and snippets [#712](https://github.com/puppetlabs/puppet-vscode/pull/712) ([jpogran](https://github.com/jpogran))
- (GH-709) Puppetfile autocomplete [#710](https://github.com/puppetlabs/puppet-vscode/pull/710) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-705) Fix Puppetfile module update date [#707](https://github.com/puppetlabs/puppet-vscode/pull/707) ([jpogran](https://github.com/jpogran))

## [0.28.0](https://github.com/puppetlabs/puppet-vscode/tree/0.28.0) - 2020-07-20

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.27.3...0.28.0)

### Added

- (GH-682) Set Puppet Forge api header version [#694](https://github.com/puppetlabs/puppet-vscode/pull/694) ([jpogran](https://github.com/jpogran))
- (GH-691) PDK New Defined Type [#692](https://github.com/puppetlabs/puppet-vscode/pull/692) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-681) Activate extension when puppet module [#693](https://github.com/puppetlabs/puppet-vscode/pull/693) ([jpogran](https://github.com/jpogran))

## [0.27.3](https://github.com/puppetlabs/puppet-vscode/tree/0.27.3) - 2020-06-18

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.27.2...0.27.3)

### Fixed

- (maint) Fix automated release packaging [#687](https://github.com/puppetlabs/puppet-vscode/pull/687) ([jpogran](https://github.com/jpogran))

## [0.27.2](https://github.com/puppetlabs/puppet-vscode/tree/0.27.2) - 2020-06-18

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.27.1...0.27.2)

### Fixed

- (GH-684) Fix pdk new module activation [#685](https://github.com/puppetlabs/puppet-vscode/pull/685) ([jpogran](https://github.com/jpogran))

## [0.27.1](https://github.com/puppetlabs/puppet-vscode/tree/0.27.1) - 2020-06-11

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.27.0...0.27.1)

### Fixed

- (GH-678) Remove Invalid Configuration Defaults [#679](https://github.com/puppetlabs/puppet-vscode/pull/679) ([jpogran](https://github.com/jpogran))

## [0.27.0](https://github.com/puppetlabs/puppet-vscode/tree/0.27.0) - 2020-06-08

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.26.1...0.27.0)

### Added

- (GH-670) Guard installType and installDirectory [#673](https://github.com/puppetlabs/puppet-vscode/pull/673) ([jpogran](https://github.com/jpogran))
- Puppetfile forge module hover provider [#672](https://github.com/puppetlabs/puppet-vscode/pull/672) ([jpogran](https://github.com/jpogran))
- (GH-666) Puppetfile view [#671](https://github.com/puppetlabs/puppet-vscode/pull/671) ([jpogran](https://github.com/jpogran))
- (GH-639) Deprecate Bolt commands [#659](https://github.com/puppetlabs/puppet-vscode/pull/659) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-663) Quote Workspace path [#664](https://github.com/puppetlabs/puppet-vscode/pull/664) ([jpogran](https://github.com/jpogran))
- (GH-649) Reduce Activation Events [#660](https://github.com/puppetlabs/puppet-vscode/pull/660) ([jpogran](https://github.com/jpogran))

## [0.26.1](https://github.com/puppetlabs/puppet-vscode/tree/0.26.1) - 2020-05-12

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.26.0...0.26.1)

### Added

- (GH-647) Puppet Facts Welcome View [#648](https://github.com/puppetlabs/puppet-vscode/pull/648) ([jpogran](https://github.com/jpogran))

## [0.26.0](https://github.com/puppetlabs/puppet-vscode/tree/0.26.0) - 2020-04-29

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.25.2...0.26.0)

### Added

- GH 630 cached facts [#635](https://github.com/puppetlabs/puppet-vscode/pull/635) ([jpogran](https://github.com/jpogran))
- GH 630 Puppet Toolbar and Puppet Facts View [#632](https://github.com/puppetlabs/puppet-vscode/pull/632) ([jpogran](https://github.com/jpogran))

## [0.25.2](https://github.com/puppetlabs/puppet-vscode/tree/0.25.2) - 2020-03-27

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.25.1...0.25.2)

## [0.25.1](https://github.com/puppetlabs/puppet-vscode/tree/0.25.1) - 2020-03-27

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.25.0...0.25.1)

## [0.25.0](https://github.com/puppetlabs/puppet-vscode/tree/0.25.0) - 2020-03-25

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.23.0...0.25.0)

### Added

- (613) Puppet Node Graph Feature Rewrite [#614](https://github.com/puppetlabs/puppet-vscode/pull/614) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-610) Fix surroundingPairs [#611](https://github.com/puppetlabs/puppet-vscode/pull/611) ([jpogran](https://github.com/jpogran))

## [0.23.0](https://github.com/puppetlabs/puppet-vscode/tree/0.23.0) - 2020-01-29

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.22.0...0.23.0)

### Added

- (GH-289) Auto Indent for Types with Titles [#602](https://github.com/puppetlabs/puppet-vscode/pull/602) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-605) Use correct setting name for module path [#606](https://github.com/puppetlabs/puppet-vscode/pull/606) ([glennsarti](https://github.com/glennsarti))

## [0.22.0](https://github.com/puppetlabs/puppet-vscode/tree/0.22.0) - 2019-12-17

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.21.0...0.22.0)

### Added

- (GH-588) Add server telemetry pass through [#589](https://github.com/puppetlabs/puppet-vscode/pull/589) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-592) Add Puppetfile resolver in Puppet-Editor-Services [#593](https://github.com/puppetlabs/puppet-vscode/pull/593) ([glennsarti](https://github.com/glennsarti))
- (maint) Update mocha to latest to fix es-abstract [#591](https://github.com/puppetlabs/puppet-vscode/pull/591) ([jpogran](https://github.com/jpogran))

## [0.21.0](https://github.com/puppetlabs/puppet-vscode/tree/0.21.0) - 2019-09-27

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.20.0...0.21.0)

### Fixed

- (GH-567) Update Editor Services and Editor Syntax components [#568](https://github.com/puppetlabs/puppet-vscode/pull/568) ([glennsarti](https://github.com/glennsarti))
- (WIP)(GH-552) Disallow Puppet version change with TCP Protocol [#561](https://github.com/puppetlabs/puppet-vscode/pull/561) ([jpogran](https://github.com/jpogran))

## [0.20.0](https://github.com/puppetlabs/puppet-vscode/tree/0.20.0) - 2019-08-28

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.19.0...0.20.0)

### Added

- (GH-541) Check for latest PDK Version [#545](https://github.com/puppetlabs/puppet-vscode/pull/545) ([jpogran](https://github.com/jpogran))
- (GH-534) Puppet Module Metadata hover provider [#529](https://github.com/puppetlabs/puppet-vscode/pull/529) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-546) Update Puppet DAG svg icon [#547](https://github.com/puppetlabs/puppet-vscode/pull/547) ([jpogran](https://github.com/jpogran))
- (maint) Fix typo for featureFlag [#539](https://github.com/puppetlabs/puppet-vscode/pull/539) ([glennsarti](https://github.com/glennsarti))

## [0.19.0](https://github.com/puppetlabs/puppet-vscode/tree/0.19.0) - 2019-07-12

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.18.1...0.19.0)

### Added

- (GH-530) Enable Extension on Workspace files [#528](https://github.com/puppetlabs/puppet-vscode/pull/528) ([jpogran](https://github.com/jpogran))

## [0.18.1](https://github.com/puppetlabs/puppet-vscode/tree/0.18.1) - 2019-06-05

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.18.0...0.18.1)

### Added

- (GH-502) Auto detect PDK or Puppet-Agent [#513](https://github.com/puppetlabs/puppet-vscode/pull/513) ([jpogran](https://github.com/jpogran))

## [0.18.0](https://github.com/puppetlabs/puppet-vscode/tree/0.18.0) - 2019-05-29

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.17.0...0.18.0)

### Changed
- (GH-502) change the default install type to PDK [#503](https://github.com/puppetlabs/puppet-vscode/pull/503) ([albatrossflavour](https://github.com/albatrossflavour))

### Added

- (GH-505) PDK New Module Button Visibility Setting [#510](https://github.com/puppetlabs/puppet-vscode/pull/510) ([jpogran](https://github.com/jpogran))
- (GH-489) Use alternate puppet version [#491](https://github.com/puppetlabs/puppet-vscode/pull/491) ([glennsarti](https://github.com/glennsarti))
- (GH-489) Refactor configration classes  [#490](https://github.com/puppetlabs/puppet-vscode/pull/490) ([glennsarti](https://github.com/glennsarti))
- (GH-494) Add Progress Bar for long lived operations [#488](https://github.com/puppetlabs/puppet-vscode/pull/488) ([glennsarti](https://github.com/glennsarti))
- (GH-489) Dynamically detect PDK information [#486](https://github.com/puppetlabs/puppet-vscode/pull/486) ([glennsarti](https://github.com/glennsarti))

### Fixed

- (GH-499) Setting to Disable Editor Services [#512](https://github.com/puppetlabs/puppet-vscode/pull/512) ([jpogran](https://github.com/jpogran))
- (GH-496) Prepare for 0.18.0 release [#497](https://github.com/puppetlabs/puppet-vscode/pull/497) ([glennsarti](https://github.com/glennsarti))

## [0.17.0](https://github.com/puppetlabs/puppet-vscode/tree/0.17.0) - 2019-02-13

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.16.0...0.17.0)

### Added

- (GH-476)(GH-477) Add Bolt Feature Support [#481](https://github.com/puppetlabs/puppet-vscode/pull/481) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-480) Automatically find PDK Ruby Version [#482](https://github.com/puppetlabs/puppet-vscode/pull/482) ([jpogran](https://github.com/jpogran))

## [0.16.0](https://github.com/puppetlabs/puppet-vscode/tree/0.16.0) - 2019-01-25

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.15.1...0.16.0)

### Added

- (maint) Update telemetry [#468](https://github.com/puppetlabs/puppet-vscode/pull/468) ([jpogran](https://github.com/jpogran))
- (GH-288) Change puppetfile snippets to single line [#463](https://github.com/puppetlabs/puppet-vscode/pull/463) ([glennsarti](https://github.com/glennsarti))
- (GH-453) Expose advanced additional Editor Service Settings [#462](https://github.com/puppetlabs/puppet-vscode/pull/462) ([glennsarti](https://github.com/glennsarti))
- (GH-295)(GH-288) Add puppetfile support [#458](https://github.com/puppetlabs/puppet-vscode/pull/458) ([glennsarti](https://github.com/glennsarti))
- (Maint) Update vendoring for Editor Syntax [#457](https://github.com/puppetlabs/puppet-vscode/pull/457) ([glennsarti](https://github.com/glennsarti))
- (GH-375) Implement Docker connection handler [#450](https://github.com/puppetlabs/puppet-vscode/pull/450) ([jpogran](https://github.com/jpogran))
- (GH-459) Use New debug adapter API [#448](https://github.com/puppetlabs/puppet-vscode/pull/448) ([glennsarti](https://github.com/glennsarti))

### Fixed

- (GH-469) Restore puppet palatte commands [#470](https://github.com/puppetlabs/puppet-vscode/pull/470) ([jpogran](https://github.com/jpogran))

## [0.15.1](https://github.com/puppetlabs/puppet-vscode/tree/0.15.1) - 2019-01-09

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.15.0...0.15.1)

### Fixed

- (GH-454) Fix PDK Ruby file path [#460](https://github.com/puppetlabs/puppet-vscode/pull/460) ([jpogran](https://github.com/jpogran))
- (GH-451) Prepare for 0.15.0 release [#452](https://github.com/puppetlabs/puppet-vscode/pull/452) ([glennsarti](https://github.com/glennsarti))

## [0.15.0](https://github.com/puppetlabs/puppet-vscode/tree/0.15.0) - 2018-12-20

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.14.0...0.15.0)

## [0.14.0](https://github.com/puppetlabs/puppet-vscode/tree/0.14.0) - 2018-12-20

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.13.1...0.14.0)

### Added

- (GH-439) Remove RestartSession Command [#444](https://github.com/puppetlabs/puppet-vscode/pull/444) ([jpogran](https://github.com/jpogran))
- (GH-335) Add option to disable language server [#442](https://github.com/puppetlabs/puppet-vscode/pull/442) ([jpogran](https://github.com/jpogran))
- (GH-447)(GH-440)(GH-446) Add modulepath setting and deprecate enable-file-cache [#441](https://github.com/puppetlabs/puppet-vscode/pull/441) ([glennsarti](https://github.com/glennsarti))
- (GH-431) Update syntax highlighting to 1.3.0 [#432](https://github.com/puppetlabs/puppet-vscode/pull/432) ([glennsarti](https://github.com/glennsarti))
- (GH-412) Implement ConnectionHandler [#425](https://github.com/puppetlabs/puppet-vscode/pull/425) ([jpogran](https://github.com/jpogran))

### Fixed

- (maint) Pin event-stream due to malicious code [#430](https://github.com/puppetlabs/puppet-vscode/pull/430) ([glennsarti](https://github.com/glennsarti))
- (GH-422) Move from preivewHTML to Web ViewAPI [#426](https://github.com/puppetlabs/puppet-vscode/pull/426) ([glennsarti](https://github.com/glennsarti))
- (GH-420) Release 0.13.2 [#421](https://github.com/puppetlabs/puppet-vscode/pull/421) ([jpogran](https://github.com/jpogran))

## [0.13.1](https://github.com/puppetlabs/puppet-vscode/tree/0.13.1) - 2018-10-30

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.13.0...0.13.1)

### Added

- (GH-416) Update Syntax [#417](https://github.com/puppetlabs/puppet-vscode/pull/417) ([jpogran](https://github.com/jpogran))

### Fixed

- (GH-415) Release 0.13.1 [#418](https://github.com/puppetlabs/puppet-vscode/pull/418) ([jpogran](https://github.com/jpogran))

## [0.13.0](https://github.com/puppetlabs/puppet-vscode/tree/0.13.0) - 2018-10-30

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.12.1...0.13.0)

### Added

- (GH-334) Update vscode-extension-telemetry [#396](https://github.com/puppetlabs/puppet-vscode/pull/396) ([jpogran](https://github.com/jpogran))
- (GH-399) Update status bar loading UI [#393](https://github.com/puppetlabs/puppet-vscode/pull/393) ([glennsarti](https://github.com/glennsarti))
- (GH-373) Convert Commands to Features [#389](https://github.com/puppetlabs/puppet-vscode/pull/389) ([jpogran](https://github.com/jpogran))
- (GH-397) Use the Language Server with sidecar (0.15.0 [#372](https://github.com/puppetlabs/puppet-vscode/pull/372) ([glennsarti](https://github.com/glennsarti))

### Fixed

- (GH-405) Update README and links into the README [#407](https://github.com/puppetlabs/puppet-vscode/pull/407) ([glennsarti](https://github.com/glennsarti))
- (maint) Fix ConnectionManager variable scope [#403](https://github.com/puppetlabs/puppet-vscode/pull/403) ([jpogran](https://github.com/jpogran))
- (GH-400) Fix Path environment parsing for Ruby Helper [#401](https://github.com/puppetlabs/puppet-vscode/pull/401) ([glennsarti](https://github.com/glennsarti))
- (maint) Fix node graph generation [#388](https://github.com/puppetlabs/puppet-vscode/pull/388) ([glennsarti](https://github.com/glennsarti))

## [0.12.1](https://github.com/puppetlabs/puppet-vscode/tree/0.12.1) - 2018-10-02

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.11.1...0.12.1)

### Fixed

- (GH-314) Update VSCode Engine to 1.27 [#381](https://github.com/puppetlabs/puppet-vscode/pull/381) ([jpogran](https://github.com/jpogran))
- (GH-373) Feature-ify Format Document provider [#374](https://github.com/puppetlabs/puppet-vscode/pull/374) ([glennsarti](https://github.com/glennsarti))
- (GH-373) Refactor node graph into a feature [#370](https://github.com/puppetlabs/puppet-vscode/pull/370) ([glennsarti](https://github.com/glennsarti))
- (GH-315) Deprecate the puppetAgentDir setting [#369](https://github.com/puppetlabs/puppet-vscode/pull/369) ([glennsarti](https://github.com/glennsarti))
- (GH-366) Refactor Debug Adapter [#367](https://github.com/puppetlabs/puppet-vscode/pull/367) ([glennsarti](https://github.com/glennsarti))
- (GH-278) Use a newer sane settings layout [#361](https://github.com/puppetlabs/puppet-vscode/pull/361) ([glennsarti](https://github.com/glennsarti))

## [0.11.1](https://github.com/puppetlabs/puppet-vscode/tree/0.11.1) - 2018-08-22

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.11.0...0.11.1)

### Added

- (GH-315) PDKIFY ALL THE THINGS [#330](https://github.com/puppetlabs/puppet-vscode/pull/330) ([jpogran](https://github.com/jpogran))
- (GH-327) Update Puppet Editor Services 0.13.0 [#326](https://github.com/puppetlabs/puppet-vscode/pull/326) ([glennsarti](https://github.com/glennsarti))

### Fixed

- (GH-356) Release 0.11.1 [#362](https://github.com/puppetlabs/puppet-vscode/pull/362) ([jpogran](https://github.com/jpogran))
- (GH-355) Re-add Telemetry [#359](https://github.com/puppetlabs/puppet-vscode/pull/359) ([jpogran](https://github.com/jpogran))
- (GH-353) Set default source to Puppet Agent [#358](https://github.com/puppetlabs/puppet-vscode/pull/358) ([jpogran](https://github.com/jpogran))
- (GH-351) Update to editor-services 0.14 [#357](https://github.com/puppetlabs/puppet-vscode/pull/357) ([jpogran](https://github.com/jpogran))
- Revert "(GH-314) Update VSCode engine to 1.25" [#352](https://github.com/puppetlabs/puppet-vscode/pull/352) ([glennsarti](https://github.com/glennsarti))
- (GH-314) Update VSCode engine to 1.25 [#347](https://github.com/puppetlabs/puppet-vscode/pull/347) ([jpogran](https://github.com/jpogran))
- (GH-354) Document PDK as source information [#346](https://github.com/puppetlabs/puppet-vscode/pull/346) ([jpogran](https://github.com/jpogran))
- (GH-343) Shallow clone process environment [#344](https://github.com/puppetlabs/puppet-vscode/pull/344) ([glennsarti](https://github.com/glennsarti))
- (GH-317) Fix extension test harness [#325](https://github.com/puppetlabs/puppet-vscode/pull/325) ([jpogran](https://github.com/jpogran))
- (GH-316) Fix KAC violations in CHANGELOG [#321](https://github.com/puppetlabs/puppet-vscode/pull/321) ([michaeltlombardi](https://github.com/michaeltlombardi))
- (GH-319) Fix if/else snippet [#320](https://github.com/puppetlabs/puppet-vscode/pull/320) ([jpogran](https://github.com/jpogran))

## [0.11.0](https://github.com/puppetlabs/puppet-vscode/tree/0.11.0) - 2018-07-16

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.9.0...0.11.0)

### Changed
- (GH-274) Remove random port detection [#294](https://github.com/puppetlabs/puppet-vscode/pull/294) ([jpogran](https://github.com/jpogran))
- (GH-253) Remove server folder [#254](https://github.com/puppetlabs/puppet-vscode/pull/254) ([jpogran](https://github.com/jpogran))

### Added

- (GH-284) Added support for #region folding [#285](https://github.com/puppetlabs/puppet-vscode/pull/285) ([neitik](https://github.com/neitik))
- (GH-281) Update pin to editor services v0.12.0 [#282](https://github.com/puppetlabs/puppet-vscode/pull/282) ([michaeltlombardi](https://github.com/michaeltlombardi))
- (GH-238) Add STDIO support [#280](https://github.com/puppetlabs/puppet-vscode/pull/280) ([jpogran](https://github.com/jpogran))
- (GH-258) Add a new vendoring process for Editor Services [#259](https://github.com/puppetlabs/puppet-vscode/pull/259) ([glennsarti](https://github.com/glennsarti))

### Fixed

- (GH-310) Fix gulp bump [#311](https://github.com/puppetlabs/puppet-vscode/pull/311) ([jpogran](https://github.com/jpogran))
- (GH-307) Fix path resolution on mac and *nix [#308](https://github.com/puppetlabs/puppet-vscode/pull/308) ([jpogran](https://github.com/jpogran))
- (GH-301) Fail fast if no agent installed [#302](https://github.com/puppetlabs/puppet-vscode/pull/302) ([jpogran](https://github.com/jpogran))
- (GH-289) Autoindent [#300](https://github.com/puppetlabs/puppet-vscode/pull/300) ([jpogran](https://github.com/jpogran))
- (GH-240) TCP Retry defaults [#297](https://github.com/puppetlabs/puppet-vscode/pull/297) ([jpogran](https://github.com/jpogran))
- (GH-241) Honor specified tcp port [#292](https://github.com/puppetlabs/puppet-vscode/pull/292) ([jpogran](https://github.com/jpogran))
- (GH-250) Move client folder to root [#251](https://github.com/puppetlabs/puppet-vscode/pull/251) ([jpogran](https://github.com/jpogran))

## [0.9.0](https://github.com/puppetlabs/puppet-vscode/tree/0.9.0) - 2018-04-04

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.10.0...0.9.0)

## [0.10.0](https://github.com/puppetlabs/puppet-vscode/tree/0.10.0) - 2018-04-04

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.8.0...0.10.0)

### Added

- (GH-236) Use an in memory and persistent object cache for Puppet assets [#237](https://github.com/puppetlabs/puppet-vscode/pull/237) ([glennsarti](https://github.com/glennsarti))
- (maint) Update syntax highlighting [#227](https://github.com/puppetlabs/puppet-vscode/pull/227) ([glennsarti](https://github.com/glennsarti))
- (GH-225) Re-add Workspace Folder detection [#226](https://github.com/puppetlabs/puppet-vscode/pull/226) ([glennsarti](https://github.com/glennsarti))
- (GH-216) Add plan, data types and numeric literals to syntax highlighter [#217](https://github.com/puppetlabs/puppet-vscode/pull/217) ([glennsarti](https://github.com/glennsarti))
- (GH-50) Add document formatter for puppet-lint [#210](https://github.com/puppetlabs/puppet-vscode/pull/210) ([glennsarti](https://github.com/glennsarti))
- (GH-166) Add find/peek definition capability to language server [#193](https://github.com/puppetlabs/puppet-vscode/pull/193) ([glennsarti](https://github.com/glennsarti))

### Fixed

- Update puppet lint - 2.3.5 [#246](https://github.com/puppetlabs/puppet-vscode/pull/246) ([glennsarti](https://github.com/glennsarti))
- (GH-231) Make document validation asynchronous [#232](https://github.com/puppetlabs/puppet-vscode/pull/232) ([glennsarti](https://github.com/glennsarti))
- (GH-218) Add support and validation of EPP files [#219](https://github.com/puppetlabs/puppet-vscode/pull/219) ([glennsarti](https://github.com/glennsarti))
- (GH-204) Fix debug server for Puppet 4.x [#205](https://github.com/puppetlabs/puppet-vscode/pull/205) ([glennsarti](https://github.com/glennsarti))
- (maint) Fix Changelog links [#200](https://github.com/puppetlabs/puppet-vscode/pull/200) ([jpogran](https://github.com/jpogran))

## [0.8.0](https://github.com/puppetlabs/puppet-vscode/tree/0.8.0) - 2017-11-24

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.7.2...0.8.0)

## [0.7.2](https://github.com/puppetlabs/puppet-vscode/tree/0.7.2) - 2017-11-22

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.7.0...0.7.2)

### Changed
- (GH-177) Remove version file detection [#178](https://github.com/puppetlabs/puppet-vscode/pull/178) ([jpogran](https://github.com/jpogran))

### Added

- (GH-#187) Add a stdio mode to the language server [#188](https://github.com/puppetlabs/puppet-vscode/pull/188) ([ananace](https://github.com/ananace))
- Add executable file mode on the puppet-languageserver binary [#182](https://github.com/puppetlabs/puppet-vscode/pull/182) ([dalen](https://github.com/dalen))
- (GH-167) Add PDK New Task [#172](https://github.com/puppetlabs/puppet-vscode/pull/172) ([jpogran](https://github.com/jpogran))
- (GH-154) Use hosted JSON schema files [#155](https://github.com/puppetlabs/puppet-vscode/pull/155) ([glennsarti](https://github.com/glennsarti))

### Fixed

- (maint) Do not error in validation exception handler [#195](https://github.com/puppetlabs/puppet-vscode/pull/195) ([glennsarti](https://github.com/glennsarti))
- (maint) Fix logger in PDK New Task [#194](https://github.com/puppetlabs/puppet-vscode/pull/194) ([glennsarti](https://github.com/glennsarti))
- (maint) Fix rubocop violations [#186](https://github.com/puppetlabs/puppet-vscode/pull/186) ([glennsarti](https://github.com/glennsarti))
- (GH-180) Display backslashes in node graph [#185](https://github.com/puppetlabs/puppet-vscode/pull/185) ([glennsarti](https://github.com/glennsarti))
- (GH-169) Fix colourisation of comments in class params [#170](https://github.com/puppetlabs/puppet-vscode/pull/170) ([glennsarti](https://github.com/glennsarti))
- (GH-97) Create a crash file when the language server abends [#162](https://github.com/puppetlabs/puppet-vscode/pull/162) ([glennsarti](https://github.com/glennsarti))
- (GH-88) Use local Graph Renderer for node graphs [#161](https://github.com/puppetlabs/puppet-vscode/pull/161) ([glennsarti](https://github.com/glennsarti))

## [0.7.0](https://github.com/puppetlabs/puppet-vscode/tree/0.7.0) - 2017-10-05

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.7.1...0.7.0)

## [0.7.1](https://github.com/puppetlabs/puppet-vscode/tree/0.7.1) - 2017-10-05

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.4.6...0.7.1)

### Added

- (GH-157) Activate Puppet Resource Command [#158](https://github.com/puppetlabs/puppet-vscode/pull/158) ([jpogran](https://github.com/jpogran))
- (GH-144) Show All PDK Commands [#145](https://github.com/puppetlabs/puppet-vscode/pull/145) ([jpogran](https://github.com/jpogran))
- (GH-140) Show a message in Node Graph preview for zero resources [#141](https://github.com/puppetlabs/puppet-vscode/pull/141) ([glennsarti](https://github.com/glennsarti))
- (GH-130) Prepare to use PDK ruby if puppet agent not available [#134](https://github.com/puppetlabs/puppet-vscode/pull/134) ([glennsarti](https://github.com/glennsarti))

### Fixed

- (GH-116) Fix packaging to conform with vsce workflow [#149](https://github.com/puppetlabs/puppet-vscode/pull/149) ([glennsarti](https://github.com/glennsarti))
- (maint) Fix Connection Restart [#148](https://github.com/puppetlabs/puppet-vscode/pull/148) ([glennsarti](https://github.com/glennsarti))
- (maint) Fix publishing of metadata.json schema [#147](https://github.com/puppetlabs/puppet-vscode/pull/147) ([glennsarti](https://github.com/glennsarti))
- (GH-140) Fix unit tests for zero resource node graph [#146](https://github.com/puppetlabs/puppet-vscode/pull/146) ([glennsarti](https://github.com/glennsarti))
- (GH-136)(GH-61) Make client langserver better [#137](https://github.com/puppetlabs/puppet-vscode/pull/137) ([glennsarti](https://github.com/glennsarti))
- Fix incorrect logger when a client error occurs [#135](https://github.com/puppetlabs/puppet-vscode/pull/135) ([glennsarti](https://github.com/glennsarti))
- (GH-120) Fix default PuppetAgentDir on Windows [#132](https://github.com/puppetlabs/puppet-vscode/pull/132) ([glennsarti](https://github.com/glennsarti))

## [0.4.6](https://github.com/puppetlabs/puppet-vscode/tree/0.4.6) - 2017-09-14

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.5.0...0.4.6)

## [0.5.0](https://github.com/puppetlabs/puppet-vscode/tree/0.5.0) - 2017-09-14

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.6.0...0.5.0)

## [0.6.0](https://github.com/puppetlabs/puppet-vscode/tree/0.6.0) - 2017-09-14

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.4.5...0.6.0)

### Added

- (GH-120) Configurable Puppet Agent directory [#121](https://github.com/puppetlabs/puppet-vscode/pull/121) ([jpogran](https://github.com/jpogran))
- adds basic PDK support [#114](https://github.com/puppetlabs/puppet-vscode/pull/114) ([jpogran](https://github.com/jpogran))
- (GH-110) Add Telemetry [#113](https://github.com/puppetlabs/puppet-vscode/pull/113) ([jpogran](https://github.com/jpogran))
- (GH-52) Add JSON schema for metadata.json [#105](https://github.com/puppetlabs/puppet-vscode/pull/105) ([glennsarti](https://github.com/glennsarti))
- (GH-92) Context Menu actions for existing commands [#93](https://github.com/puppetlabs/puppet-vscode/pull/93) ([jpogran](https://github.com/jpogran))
- Support the Puppet 5 AST on the Language Server [#90](https://github.com/puppetlabs/puppet-vscode/pull/90) ([austb](https://github.com/austb))

### Fixed

- Fix completion provider with Puppet 5.2.0 [#126](https://github.com/puppetlabs/puppet-vscode/pull/126) ([glennsarti](https://github.com/glennsarti))
- Fix travis testing [#124](https://github.com/puppetlabs/puppet-vscode/pull/124) ([jpogran](https://github.com/jpogran))
- (GH-122) Show Upgrade Message [#123](https://github.com/puppetlabs/puppet-vscode/pull/123) ([jpogran](https://github.com/jpogran))
- (GH-109) Randomize language server port when local [#112](https://github.com/puppetlabs/puppet-vscode/pull/112) ([austb](https://github.com/austb))
- (GH-103) Parse puppet-lint.rc in module directory [#111](https://github.com/puppetlabs/puppet-vscode/pull/111) ([austb](https://github.com/austb))
- We no longer need to have params to vsce package since we've hardcode… [#108](https://github.com/puppetlabs/puppet-vscode/pull/108) ([jpogran](https://github.com/jpogran))
- (GH-103) Parse /etc and ~/ config files [#104](https://github.com/puppetlabs/puppet-vscode/pull/104) ([austb](https://github.com/austb))
- (GH-98) Fix function and type loading initial fix [#101](https://github.com/puppetlabs/puppet-vscode/pull/101) ([glennsarti](https://github.com/glennsarti))

## [0.4.5](https://github.com/puppetlabs/puppet-vscode/tree/0.4.5) - 2017-06-28

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.4.2...0.4.5)

## [0.4.2](https://github.com/puppetlabs/puppet-vscode/tree/0.4.2) - 2017-06-28

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0.4.0...0.4.2)

## [0.4.0](https://github.com/puppetlabs/puppet-vscode/tree/0.4.0) - 2017-06-28

[Full Changelog](https://github.com/puppetlabs/puppet-vscode/compare/0c6523281238b5e1bb4b5b6abf1ed38d29b5432d...0.4.0)
