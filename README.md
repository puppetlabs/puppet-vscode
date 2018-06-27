
[![Version](https://vsmarketplacebadge.apphb.com/version-short/jpogran.puppet-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=jpogran.puppet-vscode) [![Installs](https://vsmarketplacebadge.apphb.com/installs/jpogran.puppet-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=jpogran.puppet-vscode) [![Build status](https://ci.appveyor.com/api/projects/status/kwt06e0lgs70us4c/branch/master?svg=true)](https://ci.appveyor.com/project/lingua-pupuli/puppet-vscode) [![Build Status](https://travis-ci.org/lingua-pupuli/puppet-vscode.svg?branch=master)](https://travis-ci.org/lingua-pupuli/puppet-vscode)

# Puppet Language Support for Visual Studio Code

This extension provides full Puppet Language support for [Visual Studio Code](https://code.visualstudio.com/).

**It is currently in technical preview, so that we can gather bug reports and find out what new features to add.**

## Requirements

You will need to have Puppet Agent installed in order to fully use this extension. You can find instructions and installation links here:

* [Windows](https://docs.puppet.com/puppet/latest/install_windows.html)
* [MacOSX](https://docs.puppet.com/puppet/latest/install_osx.html)
* [Linux](https://docs.puppet.com/puppet/latest/install_linux.html)

## Quick start

Create or open any Puppet manifest with the extension `.pp` or `.epp` and the extension will load automatically. Once loaded the extension will be available for the duration of the session.

![Example of features](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/language_server.gif)

## Platform support

- Microsoft Windows
- MacOSX
- Linux

## Features

- Syntax highlighting
- Code snippets
- Linting
- IntelliSense for resources, parameters and more
- Go to Definition of functions, types and classes
- Validation of `metadata.json` files
- Import from `puppet resource` directly into manifests
- Node graph preview
- Puppet Development Kit integration
- (Experimental) Local debugging of Puppet manifests

## Feature information

### Hover Support

Hovering over any resource, class declaration or other Puppet symbol provides instant contextual information. For example, hovering over the resource declaration lists the type name and parameter list, with all relevant help text.

### Syntax Highlighting

Syntax highlighting recognizes all versions of Puppet and displays as you type.

- Puppet DSL
- Puppet Grammar
- Module metadata files

### Code Snippets

As part of IntelliSense and Snippets, you can quickly create templates to automate repetitive series of code.

### Linting

Linting is automatically applied to the document as you edit, without having to save the file first. The validation uses [puppet-lint](https://github.com/rodjek/puppet-lint) to validate the Puppet syntax in all open puppet files. Errors and warnings appear in the Problems window in VSCode.

### Puppet Resource

You can import existing resources directly using `puppet resource`

1. Open the command palette (`Ctrl+Shift+P`) or right click on a puppet file and select the menu entry

2. Type `puppet resource` and press enter

3. Enter the resource type you want to import, for example `user`

The information returned will be pasted into the open editor window where your cursor is resting, or at the begining of an empty file.

### Node Graph preview

You can preview the [node graph](https://puppet.com/blog/visualize-your-infrastructure-models) of a manifest while you edit your Puppet Code.

1. Open the command palette (`Ctrl+Shift+P`) or right click on a puppet file and select the menu entry

2. Type `puppet open node`.. and press enter

The node graph will appear next to the manifest

### Puppet Development Kit

You can use the [Puppet Development Kit](https://puppet.com/blog/develop-modules-faster-new-puppet-development-kit) inside VS Code from the command palette.

** Note: The PDK must be installed prior to using these commands

The following commands are supported:

- pdk new module
- pdk new class
- pdk validate
- pdk test unit

To use any of the above commands, open the command palette and start typing a command. You can also use the right-click context menu or the editor menu to reach these commands.

`PDK New Module` is available even if the extension isn't loaded, the rest of the commands are only available when the extension is loaded.

`pdk convert` is not available in the command palette as it is a complicated command that requires user input to succeed. It is better to use it from the builtin terminal.

### Locally debugging Puppet manifests

**Note - This is an experimental feature**

The Puppet extension is able to debug the compilation of a Puppet manifest, much like the Go, PowerShell, and C# languages.  The debugger supports:

* Line breakpoints but not conditions on those breakpoints
* Function breakpoints
* Exception breakpoints
* Call stack
* Variables, but only at the top stack frame
* Limited interactive debug console.  For example, you can assign a variable a value, but just as in regular Puppet you can't change its value later
* Step In, Out, Over

You may be presented with a Launch Configuration on first use.  Please see the [VSCode Debugging link](https://code.visualstudio.com/docs/editor/debugging) for instructions on how to set this up.

The debugging features in the extension are based on the excellent ideas in [puppet-debugger](https://www.puppet-debugger.com/) by [Corey Osman](https://github.com/nwops).

Settings:

`manifest` - The manifest to apply.  By default this is the currently open file in the editor

`noop` - Whether the `puppet apply` sets No Operation (Noop) mode.  By default, this is set to true.  This means when running the debugger it will not make changes to your system. The [documentation about the puppet agent](https://puppet.com/docs/puppet/5.3/man/apply.html#OPTIONS) has more information about `puppet apply` and and the `noop` option.

`args` - Additional arguements to pass to `puppet apply`, for example `['--debug']` will output debug information

![Puppet Debug Adapter](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/puppet_debug.gif)

## Installing the Extension

You can install the official release of the Puppet extension by following the steps
in the [Visual Studio Code documentation](https://code.visualstudio.com/docs/editor/extension-gallery).
In the Extensions pane, search for "jpogran-puppet" extension and install it there.  You will
get notified automatically about any future extension updates!

## Experience a Problem?

### Puppet Agent Install

A commonly encountered problem is not having Puppet Agent installed on the computer you are running VSCode on. As noted in the [Requirements section](https://github.com/lingua-pupuli/puppet-vscode/blob/master/README.md#requirements), you will need to have Puppet Agent installed in order to fully use this extension, as the extension uses the Puppet binaries and the Ruby language bundled into the agent install in order to function.

If you are receiving an error right after opening a Puppet file saying that a Puppet Agent install could not be found, ensure that Puppet is installed on the system. The VSCode extension attempts to find a valid Puppet install if a path is not configured in `puppet.puppetAgentDir` in `User Settings`, so if Puppet is installed but not in a default path please check that your setting points to the correct path.

### Reloading the Puppet VSCode extension

If you haven't see the Problems Pane update in awhile, or hover and intellisense doesn't seem to showing up, and you might not know what to do. Sometimes the Puppet extension can experience problems which cause the language server to crash or not respond. The extension has a way of logging the crash, but there is something you can do to get right back to working: reload the Puppet Language Server.

You can reload the Puppet Lanuguage Server by opening the command palette and starting to type `Puppet`. A list of Puppet commands will appear, select `Puppet: Restart Current Session`. This will restart the Puppet Language Server without reloading VSCode or losing any work currently open in the editor.

![Reload Puppet Language Server](https://raw.githubusercontent.com/lingua-pupuli/puppet-vscode/master/docs/assets/reload_language_server.gif)

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
    "puppet.languageserver.debugFilePath": "C:\\Some\\file\\path.txt"
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
