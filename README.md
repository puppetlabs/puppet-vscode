# [Puppet](https://www.puppet.com) Visual Studio Code Extension

[![Version](https://vsmarketplacebadge.apphb.com/version-short/puppet.puppet-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=puppet.puppet-vscode)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/puppet.puppet-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=puppet.puppet-vscode)

The Puppet VSCode website [https://puppet-vscode.github.io/](https://puppet-vscode.github.io) contains all of the documentation previously held in this README, simplified and organized. There is also new content that shows off all the current features in greater detail, as well as new ways to use the Puppet VSCode Extension with other technologies like the [Microsoft Remote Development Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack). This README retains some quick information on how to get started and where to get help if things go wrong.

## Quick start

> For a more detailed walkthrough see the [official documentation](https://puppet-vscode.github.io/docs/getting-started/)

- Step 1: Install a supported version of the Puppet Development Kit on your system (see [Requirements](#requirements) for more information).
- Step 2: Install the Puppet [extension](https://marketplace.visualstudio.com/items?itemName=puppet.puppet-vscode) for Visual Studio Code.
- Step 3: Open or create a Puppet manifest file (a file with a `.pp` or `.epp` extension or named `Puppetfile`) and start automating!

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Requirements](#requirements)
- [Platform Support](#platform-support)
- [Usage](https://puppet-vscode.github.io/docs/getting-started/)
  - [Syntax highlighting](https://puppet-vscode.github.io/docs/features/intellisense/)
  - [Auto completion](https://puppet-vscode.github.io/docs/features/intellisense/)
  - [Hover Support](https://puppet-vscode.github.io/docs/features/intellisense/)
  - [Outline View](https://puppet-vscode.github.io/docs/features/code-navigation/)
  - [Breadcrumbs](https://puppet-vscode.github.io/docs/features/code-navigation/)
  - [Go to Symbol](https://puppet-vscode.github.io/docs/features/code-navigation/)
    [Open Symbol by Name](https://puppet-vscode.github.io/docs/features/code-navigation/)
  - [Code Snippets](#code-snippets)
  - [Linting](https://puppet-vscode.github.io/docs/features/linting/)
  - [Live Workspace Intellisense](https://puppet-vscode.github.io/docs/features/intellisense)
  - [Puppet Commands](https://puppet-vscode.github.io/docs/features/puppet-commands/)
    - [Puppet Resource](https://puppet-vscode.github.io/docs/features/puppet-commands/)
    - [Puppet Node Graph](https://puppet-vscode.github.io/docs/features/puppet-commands/)
  - [Puppet Development Kit Support](https://puppet-vscode.github.io/docs/features/puppet-development-kit/)
    - [PDK Supported Versions](https://puppet-vscode.github.io/docs/features/puppet-development-kit/)
    - [PDK New Module](https://puppet-vscode.github.io/docs/features/puppet-development-kit/)
    - [PDK New Class](https://puppet-vscode.github.io/docs/features/puppet-development-kit/)
    - [PDK Validate](https://puppet-vscode.github.io/docs/features/puppet-development-kit/)
    - [PDK Test Unit](https://puppet-vscode.github.io/docs/features/puppet-development-kit/)
  - [Puppet Bolt Support](https://puppet-vscode.github.io/docs/features/puppet-bolt/)
  - [Debugging Puppet manifests](https://puppet-vscode.github.io/docs/features/debugging-puppet-code/)
- [Installing the Extension](#installing-the-extension)
- [Configuration](https://puppet-vscode.github.io/docs/extension-settings/)
- [Experience a Problem?](#experience-a-problem)
  - [Puppet Agent Install](#puppet-agent-install)
  - [Reloading the Puppet VSCode extension](#reloading-the-puppet-vscode-extension)
- [Reporting Problems](#reporting-problems)
- [Maintainers](#maintainers)
- [Telemetry](#telemetry)
- [License](#license)

## Features

A [Visual Studio Code](https://code.visualstudio.com/) [extension](https://marketplace.visualstudio.com/VSCode) that provides rich support for the [Puppet](https://www.puppet.com) language, including features such as syntax highlighting, linting, debugging, IntelliSense and more.

This extension provides full Puppet Language support for [Visual Studio Code](https://code.visualstudio.com/).

- Syntax highlighting
- IntelliSense for resources, parameters and more
- Outline View
- Breadcrumbs
- Go to Symbol
- Open Symbol by Name
- Linting
- Live Workspace Intellisense
- Code snippets
- Go to Definition of functions, types and classes
- Validation of `metadata.json` files
- Import from `puppet resource` directly into manifests
- Node graph preview
- Puppet Development Kit integration
- (Experimental) Local debugging of Puppet manifests
- **DEPRECATED** Docker Language Server support

**It is currently in technical preview, so that we can gather bug reports and find out what new features to add.**

## Supported Puppet Versions

The Puppet Extension for VSCode works with Puppet 4 or higher. Some features will be slower or not work on Puppet 4, and are noted in the section for that feature. See [open source Puppet](https://puppet.com/docs/puppet/5.5/about_agent.html) and [Puppet Enterprise](https://puppet.com/docs/pe/2017.3/getting_support_for_pe.html#supported-puppet-enterprise-versions) lifecycle pages for version support details.

## Requirements

You will need to have the [Puppet Development Kit (PDK)](https://puppet.com/docs/pdk/1.x/pdk.html) or [Puppet Agent](https://puppet.com/docs/puppet/latest/about_agent.html) installed in order to fully use this extension.

> Note: When using PDK, version 1.5.0 or higher is required.

You can find instructions and installation links here:

### PDK

- [Download page](https://puppet.com/download-puppet-development-kit)

### Puppet-Agent

- [Windows](https://docs.puppet.com/puppet/latest/install_windows.html)
- [MacOSX](https://docs.puppet.com/puppet/latest/install_osx.html)
- [Linux](https://docs.puppet.com/puppet/latest/install_linux.html)

## Platform support

- Microsoft Windows
- MacOSX
- Linux

## Installing the Extension

You can install the official release of the Puppet extension by following the steps in the [Visual Studio Code documentation](https://code.visualstudio.com/docs/editor/extension-gallery). In the Extensions pane, search for "puppet-vscode" extension and install it there. You will get notified automatically about any future extension updates!

![extension_install](https://raw.githubusercontent.com/puppetlabs/puppet-vscode/master/docs/assets/extension_install.gif)

You can also install the extension without access to the internet by following these [instructions](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix.)

## Experience a Problem?

### Puppet Agent Install

A commonly encountered problem is not having the PDK or Puppet Agent installed on the computer you are running VSCode on. As noted in the [Requirements section](https://github.com/puppetlabs/puppet-vscode/blob/master/README.md#requirements), you will need to have the PDK or Puppet Agent installed in order to fully use this extension, as the extension uses the Puppet binaries and the Ruby language bundled into the PDK or agent install in order to function.

If you are receiving an error right after opening a Puppet file saying that a Puppet Agent install could not be found, ensure that Puppet is installed on the system. The VSCode extension attempts to find a valid Puppet install if a path is not configured in `puppet.installDirectory` in `User Settings`, so if Puppet is installed but not in a default path please check that your setting points to the correct path.

### Reloading the Puppet VSCode extension

If you haven't see the Problems Pane update in awhile, or hover and intellisense doesn't seem to showing up, and you might not know what to do. Sometimes the Puppet extension can experience problems which cause the language server to crash or not respond. The extension has a way of logging the crash, but there is something you can do to get right back to working: reload the Puppet Language Server.

You can reload the Puppet Language Server by opening the command palette and starting to type `Reload`. A list of commands will appear, select `Reload Window`. This will reload the Visual Studio Code window without closing down the entire editor, and without losing any work currently open in the editor.

## Reporting Problems

If you're having trouble with the Puppet extension, please follow these instructions
to file an issue on our GitHub repository:

### 1. File an issue on our [Issues Page](https://github.com/puppetlabs/puppet-vscode/issues)

Make sure to fill in the information that is requested in the issue template as it
will help us investigate the problem more quickly.

### 2. Capture verbose logs and send them to us

If you're having an issue with crashing or other erratic behavior, add the following
line to your User Settings in Visual Studio Code:

```json
    "puppet.editorService.loglevel": "debug",
    "puppet.editorService.debugFilePath": "C:\\Some\\file\\path.txt"
```

Restart Visual Studio Code and try to reproduce the problem, then examine the log. If the issue persists please open an issue and add both the content of the `Output` pane as well as the content in the log file. Please inspect the log and be sure to redact any information you would not want posted publicly.

## Maintainers

- [James Pogran](https://github.com/jpogran) - [@ender2025](http://twitter.com/ender2025)
- [Glenn Sarti](https://github.com/glennsarti) - [@glennsarti](http://twitter.com/glennsarti)
- [Michael T Lombardi](https://github.com/michaeltlombardi) - [@barbariankb](http://twitter.com/barbariankb)

## Telemetry

This extension collects telemetry data to help us build a better experience for writing manifest and modules with Puppet and VS Code. We only collect data on which commands are executed. We do not collect any information about files, paths, etc. The extension respects the `telemetry.enableTelemetry` setting which you can learn more about in our [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## License

This extension is [licensed under the Apache-2.0 License](LICENSE.txt).
