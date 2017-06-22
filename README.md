<!--
TODO: Need correct marketplace ID
[![Version](https://vsmarketplacebadge.apphb.com/version/jpogran.Puppet.svg)](https://marketplace.visualstudio.com/items?itemName=jpogran.Puppet)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/jpogran.Puppet.svg)](https://marketplace.visualstudio.com/items?itemName=jpogran.Puppet)
-->

# Puppet Language Support for Visual Studio Code

This extension provides Puppet Language support for [Visual Studio Code](https://code.visualstudio.com/)

The extension is composed of the VS Code Extension in the [`client/`](client) directory and the Puppet Language Server in the [`server/`](server) directory


## How to run the client and server for development

### Run the language server

Follow the instructions in the server documentation - [How to run the Language Server for Develoment](server/READMEmd#How_to_run_the_Language_Server_for_Development). Ensure you use the `--timeout=0` and `--no-stop` arguments so the server does not stop.

### Run the client

* Ensure nodejs is installed

* Clone this repository

```bash
> git clone https://github.com/jpogran/puppet-vscode.git

> cd puppet-vscode
> cd client
```

* Install the node modules

```bash
client > npm install
...

> puppet-vscode@0.0.3 postinstall C:\Source\puppet-vscode\client
> node ./node_modules/vscode/bin/install
...
Detected VS Code engine version: ^1.10.0
Found minimal version that qualifies engine range: 1.10.0
Fetching vscode.d.ts from: https://raw.githubusercontent.com/Microsoft/vscode/1.10.0/src/vs/vscode.d.ts
vscode.d.ts successfully installed!
```

* Copy the Language Server for vendoring into the extensions

```bash
client > node node_modules/gulp/bin/gulp.js copy_language_server
[15:13:02] Using gulpfile client/gulpfile.js
[15:13:02] Starting 'copy_language_server'...
[15:13:02] Finished 'copy_language_server' after 193 ms
```

* Start VS Code

```bash
client > code .
```

* Once VS Code is running, press `F5` to start a build and a new VS Code development instance should start

* Open a Puppet file (.pp) and the client will start and connect to the Puppet Server

> Other Puppet VS Code extensions may cause issues with the development instance.  Ensure that you either uninstall or disable the other Puppet extensions prior.

## Issues

Please raise issues for the Language Server or Extension using the GitHub issue tracker.
