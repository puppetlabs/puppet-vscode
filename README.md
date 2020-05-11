# [Puppet Visual Studio Code Extension](https://puppet-vscode.github.io)

[![Version](https://vsmarketplacebadge.apphb.com/version-short/puppet.puppet-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=puppet.puppet-vscode)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/puppet.puppet-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=puppet.puppet-vscode)

# Quick start

> For a more detailed walkthrough see the [official documentation](https://puppet-vscode.github.io/docs/getting-started/)

- Step 1: Install a supported version of the Puppet Development Kit on your system (see [Requirements](#requirements) for more information).
- Step 2: Install the Puppet [extension](https://marketplace.visualstudio.com/items?itemName=puppet.puppet-vscode) for Visual Studio Code.
- Step 3: Open or create a Puppet manifest file (a file with a `.pp` or `.epp` extension or named `Puppetfile`) and start automating!

# Features

The Puppet Visual Studio Code Eextension provides rich support for the [Puppet](https://www.puppet.com) language, including features such as syntax highlighting, linting, debugging, IntelliSense and more.

This extension provides many advanced features which can be seen at our official [site](https://puppet-vscode.github.io), a short list follows:

- Syntax highlighting
- IntelliSense for Puppet resources, parameters and more
- Outline View, Breadcrumbs and Go to Symbol/Definition of functions, types and classes support
- Linting and real-time validation of Puppet manifests and Bolt Plans
- (Experimental) Local debugging of Puppet manifests

# Requirements

You will need to have the [Puppet Development Kit (PDK)](https://puppet.com/docs/pdk/1.x/pdk.html) or [Puppet Agent](https://puppet.com/docs/puppet/latest/about_agent.html) installed in order to fully use this extension.

> Note: When using PDK, version 1.5.0 or higher is required.

## PDK

- [Download page](https://puppet.com/download-puppet-development-kit)

## Puppet-Agent

- [Download instructions](https://puppet.com/docs/puppet/latest/install_agents.html)

## Platform support

- Microsoft Windows
- MacOSX
- Linux

# Installing the Extension

You can install the official release of the Puppet extension by following the steps in the [Visual Studio Code documentation](https://code.visualstudio.com/docs/editor/extension-gallery). In the Extensions pane, search for "puppet-vscode" extension and install it there. You will get notified automatically about any future extension updates!

![extension_install](https://puppet-vscode.github.io/img/extension_install.gif)

You can also install the extension without access to the internet by following these [instructions](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix.)

# Experience a Problem?

## Puppet Agent Install

A commonly encountered problem is not having the PDK or Puppet Agent installed on the computer you are running VSCode on. As noted in the [Requirements section](https://github.com/puppetlabs/puppet-vscode/blob/master/README.md#requirements), you will need to have the PDK or Puppet Agent installed in order to fully use this extension, as the extension uses the Puppet binaries and the Ruby language bundled into the PDK or agent install in order to function.

If you are receiving an error right after opening a Puppet file saying that a Puppet install could not be found, ensure that Puppet is installed on the system. The VSCode extension attempts to find a valid Puppet install if a path is not configured in `puppet.installDirectory` in `User Settings`, so if Puppet is installed but not in a default path please check that your setting points to the correct path.

## Reloading the Puppet VSCode extension

If you haven't see the Problems Pane update in awhile, or hover and intellisense doesn't seem to showing up, and you might not know what to do. Sometimes the Puppet extension can experience problems which cause the language server to crash or not respond. The extension has a way of logging the crash, but there is something you can do to get right back to working: reload the Puppet Language Server.

You can reload the Puppet Language Server by opening the command palette and starting to type `Reload`. A list of commands will appear, select `Reload Window`. This will reload the Visual Studio Code window without closing down the entire editor, and without losing any work currently open in the editor.

# Reporting Problems

If you're having trouble with the Puppet extension, please follow these instructions
to file an issue on our GitHub repository:

## 1. File an issue on our [Issues Page](https://github.com/puppetlabs/puppet-vscode/issues)

Make sure to fill in the information that is requested in the issue template as it
will help us investigate the problem more quickly.

## 2. Capture verbose logs and send them to us

If you're having an issue with crashing or other erratic behavior, add the following
line to your User Settings in Visual Studio Code:

```json
    "puppet.editorService.loglevel": "debug",
    "puppet.editorService.debugFilePath": "C:\\Some\\file\\path.txt"
```

Restart Visual Studio Code and try to reproduce the problem, then examine the log. If the issue persists please open an issue and add both the content of the `Output` pane as well as the content in the log file. Please inspect the log and be sure to redact any information you would not want posted publicly.

# Telemetry

This extension collects telemetry data to help us build a better experience for writing manifest and modules with Puppet and VS Code. We only collect data on which commands are executed. We do not collect any information about files, paths, etc. The extension respects the `telemetry.enableTelemetry` setting which you can learn more about in the official VS Code [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

# Development

## Setup the project

* Ensure nodejs is installed. Look [here](https://github.com/Microsoft/vscode/wiki/How-to-Contribute#prerequisites) for current node version VS Code uses.

* Clone this repository

```bash
> git clone https://github.com/puppetlabs/puppet-vscode.git

> cd puppet-vscode
```

* Setup the project

```powershell
> pwsh ./build.ps1
```

* Once VS Code is running, press `F5` to start a build and a new VS Code development instance should start

* Open a Puppet file (.pp) and the client will start and connect to the Puppet Server

> Other VS Code extensions may cause issues with the development instance. Ensure that you either uninstall or disable the other Puppet extensions prior.

## Vendoring other resources

The Puppet Extension relies on the Puppet Editor Services and Puppet Editor Syntax projects.

* Puppet Editor Services (`puppet-editor-services`)
* Puppet Editor Syntax (`puppet-editor-syntax`)

By default the extension will use the specified versions in the `package.json` file when vendoring resources.

### Example configuration

The following examples use `editorServices`, however the configuration settings can be used on any resource.

#### By release tag

To use version `0.26.0` of the Editor Services;

``` json
{
  "editorComponents":{
    "editorServices": {
      "release": "0.26.0"
    }
  }
}
```

To use version `0.26.0` from a different Github repo

```json
{
  "editorServices": {
    "release": "0.26.0",
    "githubrepo": "puppet-editor-services",
    "githubuser": "glennsarti"
  }
}
```

#### Specific github repository or branch

To use a specific GitHub repository that contains the Puppet Editor services, use the `githubref` configuration setting; for example to use the `puppet-editing` repository, owned by `Alice` with the `testing` branch


```json
{
  "editorServices": {
    "githubrepo": "puppet-editor-services",
    "githubref": "alice:testing"
  },
}
```

> Note - For `editorServices` the default the githubuser is `puppetlabs` and the githubrepo is `puppet-editor-services`

> Note - For `editorSyntax` the default the githubuser is `puppetlabs` and the githubrepo is `puppet-editor-syntax`

#### Using a local directory

To use a local directory that contains the Puppet Editor services, use the `directory` configuration setting; for example if the the editor services was located in `C:\puppet-editor-services` use the following;

``` json
{
  "editor-services": {
    "directory": "C:\\puppet-editor-services"
  }
}
```

> Note - Backslashes in the path must be escaped.

# Maintainers

- [James Pogran](https://github.com/jpogran) - [@ender2025](http://twitter.com/ender2025)
- [Glenn Sarti](https://github.com/glennsarti) - [@glennsarti](http://twitter.com/glennsarti)
- [Michael T Lombardi](https://github.com/michaeltlombardi) - [@barbariankb](http://twitter.com/trebuchetops)

# License

This extension is [licensed under the Apache-2.0 License](https://raw.githubusercontent.com/puppetlabs/puppet-vscode/master/LICENSE).
