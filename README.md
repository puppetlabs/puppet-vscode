# [Puppet](https://www.puppet.com) extension for Visual Studio Code

[![Version](https://vsmarketplacebadge.apphb.com/version-short/jpogran.puppet-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=jpogran.puppet-vscode)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/jpogran.puppet-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=jpogran.puppet-vscode)
[![Appveyor](https://ci.appveyor.com/api/projects/status/8ke8fhdt9a7j688m/branch/master?svg=true)](https://ci.appveyor.com/project/lingua-pupuli/puppet-vscode/branch/master)
[![Travis Ci](https://travis-ci.org/lingua-pupuli/puppet-vscode.svg?branch=master)](https://travis-ci.org/lingua-pupuli/puppet-vscode)

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Requirements](#requirements)
- [Platform Support](#platform-support)
- [Usage](#usage) 
  - [Syntax highlighting](#syntax-highlighting)
  - [Auto completion](#auto-completion)
  - [Hover Support](#hover-support)
  - [Outline View](#outline-view)
  - [Breadcrumbs](#breadcrumbs)
  - [Go to Symbol](#go-to-symbol)
  - [Code Snippets](#code-snippets)
  - [Linting](#linting)
  - [Live Workspace Intellisense](#live-workspace-intellisense)
  - [Puppet Commands](#puppet-commands)
    - [Puppet Resource](#puppet-resource)
    - [Puppet Node Graph](#puppet-node-graph)
  - [Puppet Development Kit Support](#puppet-development-kit-support)
    - [PDK New Module](#pdk-new-module)
    - [PDK New Class](#pdk-new-class)
    - [PDK Validate](#pdk-validate)
    - [PDK Test Unit](#pdk-test-unit)
  - [Debugging Puppet manifests](#debugging-puppet-manifests)
- [Installing the Extension](#installing-the-extension)
- [Configuration](#configuration)
- [Experience a Problem?](#experience-a-problem)
  - [Puppet Agent Install](#puppet-agent-install)
  - [Reloading the Puppet VSCode extension](#reloading-the-puppet-vscode-extension)
- [Reporting Problems](#reporting-problems)
- [Maintainers](#maintainers)
- [Telemetry](#telemetry)
- [License](#license)

## Quick start

- Step 1: Install a supported version of the Puppet Development Kit on your system (see [Requirements](#requirements) for more information).
- Step 2: Install the Puppet [extension](https://marketplace.visualstudio.com/items?itemName=jpogran.puppet-vscode) for Visual Studio Code.
- Step 3: Open or create a Puppet manifest file (a file with a `.pp` or `.epp` extension or named `Puppetfile`) and start automating!

## Features

A [Visual Studio Code](https://code.visualstudio.com/) [extension](https://marketplace.visualstudio.com/VSCode) that provides rich support for the [Puppet](https://www.puppet.com) language, including features such as syntax highlighting, linting, debugging, IntelliSense and more.

This extension provides full Puppet Language support for [Visual Studio Code](https://code.visualstudio.com/).

- Syntax highlighting
- IntelliSense for resources, parameters and more
- Outline View
- Breadcrumbs
- Go to Symbol
- Linting
- Code snippets
- Go to Definition of functions, types and classes
- Validation of `metadata.json` files
- Import from `puppet resource` directly into manifests
- Node graph preview
- Puppet Development Kit integration
- (Experimental) Local debugging of Puppet manifests

**It is currently in technical preview, so that we can gather bug reports and find out what new features to add.**

## Requirements

You will need to have the [Puppet Agent](https://puppet.com/docs/puppet/4.10/about_agent.html)  or [Puppet Development Kit (PDK)](https://puppet.com/docs/pdk/1.x/pdk.html) installed in order to fully use this extension.

> Note: PDK version 1.5.0 or higher is required.

You can find instructions and installation links here:

### PDK

* [Download page](https://puppet.com/download-puppet-development-kit)

### Puppet-Agent

* [Windows](https://docs.puppet.com/puppet/latest/install_windows.html)
* [MacOSX](https://docs.puppet.com/puppet/latest/install_osx.html)
* [Linux](https://docs.puppet.com/puppet/latest/install_linux.html)

## Platform support

- Microsoft Windows
- MacOSX
- Linux

## Usage

### Loading indicator

The Puppet extension includes additional information in the form of a tooltip which describes the features that are loaded and still loading during startup.

![loading_status](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/loading_status.gif)


### Syntax Highlighting

Syntax highlighting recognizes all versions of Puppet and displays as you type.

- Puppet DSL
- Puppet Grammar
- Module metadata files

![syntax_highlighting](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/syntax_highlighting.png)

### Auto Completion

Auto complete Puppet types and classes and their parameter sets as you type. Tab completion works as you would expect.

![auto_complete](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/auto_complete.gif)

### Hover Support

Hovering over any resource, class declaration or other Puppet symbol provides instant contextual information. For example, hovering over the resource declaration lists the type name and parameter list, with all relevant help text.

![hover_support](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/hover_support.gif)

### Outline View

The new `Outline View` shows the symbol tree of the currently selected Puppet manifest. 

Supported symbols:

- Class
- Defined Type
- Attribute
- Variable

More symbols are planned to be added.

> Note: Puppet 4 is not supported for symbols

![outline_view](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/outline_view.gif)

### Breadcrumbs

When the `breadcrumbs.enabled` setting is set to true, both the file path and the symbol tree hierarchy are shown in the Breadcrumb view.

> Note: Puppet 4 is not supported for symbols

![breadcrumbs](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/breadcrumbs.gif)

### Go to Symbol

Opening the `Command Palette` and typing the `@` symbol initiates the `Go to Symbol` view which allows you to navigate around inside a Puppet manifest more quickly.

> Note: Puppet 4 is not supported for symbols

![go_to_symbol](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/go_to_symbol.gif)

### Code Snippets

As part of IntelliSense and Snippets, you can quickly create templates to automate repetitive series of code.

### Linting

Linting is automatically applied to the document as you edit, without having to save the file first. The validation uses [puppet-lint](https://github.com/rodjek/puppet-lint) to validate the Puppet syntax in all open puppet files. Errors and warnings appear in the Problems window in VSCode.

### Live Workspace Intellisense

If you are editing a module you will now get live intellisense of the [Puppet Custom Types](https://puppet.com/docs/puppet/latest/custom_types.html), [Functions](https://puppet.com/docs/puppet/latest/lang_write_functions_in_puppet.html), [Classes](https://puppet.com/docs/puppet/latest/lang_classes.html) and [Defined Types](https://puppet.com/docs/puppet/latest/lang_defined_types.html). For example if you are editing the [puppetlabs-apache module](https://github.com/puppetlabs/puppetlabs-apache) you will be able to get auto-complete for resources like `apache::vhost` or `apache::mod::php`.

Support for [Control Repositories](https://puppet.com/docs/pe/latest/control_repo.html) is _coming soon!_

> Note: Workspace Intellisense is only updated when you save a file, instead of features like linting which update as you type

### Puppet Commands

#### Puppet Resource

You can import existing resources directly using `puppet resource`

1. Open the command palette (`Ctrl+Shift+P`) or right click on a puppet file and select the menu entry

2. Type `puppet resource` and press enter

3. Enter the resource type you want to import, for example `user`

The information returned will be pasted into the open editor window where your cursor is resting, or at the begining of an empty file.

![puppet_resource](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/puppet_resource.gif)

#### Puppet Node Graph preview

You can preview the [node graph](https://puppet.com/blog/visualize-your-infrastructure-models) of a manifest while you edit your Puppet Code.

1. Open the command palette (`Ctrl+Shift+P`) or right click on a puppet file and select the menu entry

2. Type `puppet open node`.. and press enter

The node graph will appear next to the manifest

![puppet_node_graph](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/puppet_node_graph.gif)

### Puppet Development Kit Support

You can use the [Puppet Development Kit](https://puppet.com/blog/develop-modules-faster-new-puppet-development-kit) inside VS Code from the command palette. To use any of the above commands, open the command palette and start typing a command. You can also use the right-click context menu or the editor menu to reach these commands.

> Note: The PDK must be installed prior to using these commands

> Note: `pdk convert` is not available in the command palette as it is a complicated command that requires user input to succeed. It is better to use it from the builtin terminal.

#### PDK new module

`PDK New Module` is available even if the extension isn't loaded, the rest of the commands are only available when the extension is loaded.

![pdk_new_module](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/pdk_new_module.gif)

#### PDK new class

You can create new classes using PDK using the VS Code command palette. This functionality is only available when a Puppet file has already been opened, to trigger the extension.

![pdk_new_class](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/pdk_new_class.gif)

#### PDK validate

You can initiate a valiadtion of your module using PDK using the VS Code command palette. This functionality is only available when a Puppet file has already been opened, to trigger the extension.

![pdk_validate](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/pdk_validate.gif)

#### PDK test unit

You can run the test suite of your module using PDK using the VS Code command palette. This functionality is only available when a Puppet file has already been opened, to trigger the extension.

![pdk_test_unit](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/pdk_test_unit.gif)

### Debugging Puppet manifests

**Note - This is an experimental feature**

The Puppet extension is able to debug the compilation of a Puppet manifest; much like the Go, PowerShell, and C# languages. The debugger supports:

* Line breakpoints but not conditions on those breakpoints
* Function breakpoints
* Exception breakpoints
* Call stack
* Variables, but only at the top stack frame
* Limited interactive debug console.  For example, you can assign a variable a value, but just as in regular Puppet you can't change its value later
* Step In, Out, and Over


![Puppet Debug Adapter](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/puppet_debug.gif)

The debugging features in the extension are based on the excellent ideas in [puppet-debugger](https://www.puppet-debugger.com/) by [Corey Osman](https://github.com/nwops).

#### Configuring the debug session

To debug a simple manifest in VS Code, press `F5` and VS Code will try to debug your currently active manifest by running the equivalent of `puppet apply`. Note that by default No Operation (`--noop`) is enabled so that your local computer will not be modified.

The [VSCode Debugging - Launch Configurations](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations) website has instructions on how to configure the debug session with more advanced options.

#### Settings

- `manifest` - The manifest to apply.  By default this is the currently open file in the editor

- `noop` - Whether the `puppet apply` sets No Operation (Noop) mode.  By default, this is set to true.  This means when running the debugger it will not make changes to your system. The [documentation about the puppet agent](https://puppet.com/docs/puppet/5.3/man/apply.html#OPTIONS) has more information about `puppet apply` and and the `noop` option.

- `args` - Additional arguements to pass to `puppet apply`, for example `['--debug']` will output debug information

## Installing the Extension

You can install the official release of the Puppet extension by following the steps in the [Visual Studio Code documentation](https://code.visualstudio.com/docs/editor/extension-gallery). In the Extensions pane, search for "puppet-vscode" extension and install it there. You will get notified automatically about any future extension updates!

![extension_install](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/extension_install.gif)

You can also install the extension without access to the internet by following these [instructions](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix.)

## Configuration

The Puppet VSCode extension can use the PDK or the Puppet Agent to provide advanced features, which can be set using two configuration options: `puppet.installType` and `puppet.puppetAgentDir`.

- By default the `puppet.installType` is set to `agent`, and allows you to choose to use `pdk` or `agent`.
- The `puppet.puppetAgentDir` allows you to choose a custom path to either a PDK install or a Puppet-Agent install, and must match the correct setting in `puppet.installType`.

If no settings are chosen, the extension will attempt to use the Puppet Agent, to force it to use the PDK you have to select `pdk` for `puppet.installType`.


> Note: The `puppet.puppetAgentDir` setting name will be changed in the `0.12.0` release to `puppet.installDirectory`

> Note: Only PDK v1.5.0 and above are supported.

### Configure extension to use PDK

To ensure that the extension uses the PDK, set the `puppet.installType` setting to the `pdk` value like so:

```json
{
  "puppet.installType":"pdk"
}
```

The default installation paths stored in the extension are:

```json
{
  // Windows
  "puppet.puppetAgentDir":"C:\\Program Files\\Puppet Labs\\DevelopmentKit",
  // Mac
  "puppet.puppetAgentDir":"/opt/puppetlabs/pdk",
  // Linux
  "puppet.puppetAgentDir":"/opt/puppetlabs/pdk"
}
```

To use a custom install path for the PDK, set the `puppet.puppetAgentDir` setting to the path you installed the PDK to:

```json
{
  "puppet.puppetAgentDir":"D:/programs/pdk"
}
```

### Configure extension to use Puppet-Agent

To ensure that the extension uses the Puppet-Agent, set the `puppet.installType` setting to the `puppet` value like so:

```json
{
  "puppet.installType":"puppet"
}
```

The default installation paths stored in the extension are:

```json
{
  // Windows
  "puppet.puppetAgentDir":"C:\\Program Files\\Puppet Labs\\Puppet",
  // Mac
  "puppet.puppetAgentDir":"/opt/puppetlabs",
  //Linux
  "puppet.puppetAgentDir":"/opt/puppetlabs"
}
```

To use a custom install path for the Puppet-Agent, set the `puppet.puppetAgentDir` setting to the path you installed the Puppet-Agent to:

```json
{
  "puppet.puppetAgentDir":"D:/programs/puppet"
}
```

## Experience a Problem?

### Puppet Agent Install

A commonly encountered problem is not having the PDK or Puppet Agent installed on the computer you are running VSCode on. As noted in the [Requirements section](https://github.com/lingua-pupuli/puppet-vscode/blob/master/README.md#requirements), you will need to have the PDK or Puppet Agent installed in order to fully use this extension, as the extension uses the Puppet binaries and the Ruby language bundled into the PDK or agent install in order to function.

If you are receiving an error right after opening a Puppet file saying that a Puppet Agent install could not be found, ensure that Puppet is installed on the system. The VSCode extension attempts to find a valid Puppet install if a path is not configured in `puppet.installDirectory` in `User Settings`, so if Puppet is installed but not in a default path please check that your setting points to the correct path.

### Reloading the Puppet VSCode extension

If you haven't see the Problems Pane update in awhile, or hover and intellisense doesn't seem to showing up, and you might not know what to do. Sometimes the Puppet extension can experience problems which cause the language server to crash or not respond. The extension has a way of logging the crash, but there is something you can do to get right back to working: reload the Puppet Language Server.

You can reload the Puppet Lanuguage Server by opening the command palette and starting to type `Reload`. A list of commands will appear, select `Reload Window`. This will reload the Visual Studio Code window without closing down the enitre edtior, and without losing any work currently open in the editor.

## Reporting Problems

If you're having trouble with the Puppet extension, please follow these instructions
to file an issue on our GitHub repository:

### 1. File an issue on our [Issues Page](https://github.com/lingua-pupuli/puppet-vscode/issues)

Make sure to fill in the information that is requested in the issue template as it
will help us investigate the problem more quickly.

### 2. Capture verbose logs and send them to us

If you're having an issue with crashing or other erratic behavior, add the following
line to your User Settings in Visual Studio Code:

```json
    "puppet.editorService.debugFilePath": "C:\\Some\\file\\path.txt"
```

Restart Visual Studio Code and try to reproduce the problem, then examine the log. If the issue persists please open an issue.

## Maintainers

- [James Pogran](https://github.com/jpogran) - [@ender2025](http://twitter.com/ender2025)
- [Glenn Sarti](https://github.com/glennsarti) - [@glennsarti](http://twitter.com/glennsarti)
- [Michael T Lombardi](https://github.com/michaeltlombardi) - [@barbariankb](http://twitter.com/barbariankb)
- [Austin Blatt](https://github.com/austb)

## Telemetry

This extension collects telemetry data to help us build a better experience for writing manifest and modules with Puppet and VS Code. We only collect data on which commands are executed. We do not collect any information about files, paths, etc. The extension respects the `telemetry.enableTelemetry` setting which you can learn more about in our [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## License

This extension is [licensed under the Apache-2.0 License](LICENSE.txt).
