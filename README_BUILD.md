# Puppet Language Support for Visual Studio Code

This extension provides Puppet Language support for [Visual Studio Code](https://code.visualstudio.com/)

## How to run the client and server for development

### Setup the client

* Ensure nodejs is installed

* Clone this repository

```bash
> git clone https://github.com/puppetlabs/puppet-vscode.git

> cd puppet-vscode
```

* Install the node modules

```bash
> npm install
...

> puppet-vscode@0.0.3 postinstall C:\Source\puppet-vscode\client
> node ./node_modules/vscode/bin/install
...
Detected VS Code engine version: ^1.10.0
Found minimal version that qualifies engine range: 1.10.0
Fetching vscode.d.ts from: https://raw.githubusercontent.com/Microsoft/vscode/1.10.0/src/vs/vscode.d.ts
vscode.d.ts successfully installed!
```

### Vendoring other resources

The following resources are vendored into the extension;

* Puppet Editor Services (`editor-services`)

* Puppet Editor Syntax (`editorSyntax`)

By default the extension will use the specified versions in the `package.json` file when vendoring resources.

#### Example configuration

The following examples use `editorServices`, however the configuration settings can be used on any resource.

##### By release tag

To use version `0.10.0` of the Editor Services;

``` json
{
  "editorComponents":{
    "editorServices": {
      "release": "0.10.0"
    }
  }
}
```

##### Specific github repository or branch

To use a specific GitHub repository that contains the Puppet Editor services, use the `githubref` configuration setting; for example to use the `puppet-editing` repository, owned by `Alice` with the `testing` branch

``` json
{
  "editorComponents":{
    "editorServices": {
      "githubuser": "Alice",
      "githubrepo": "puppet-editing",
      "githubref": "testing"
    }
  }
}
```

Note - For `editorServices` the default the githubuser is `lingua-pupuli` and the githubrepo is `puppet-editor-services`

Note - For `editorSyntax` the default the githubuser is `lingua-pupuli` and the githubrepo is `puppet-editor-syntax`

Note - Use the full length commit SHA for `githubref`, not the abbreviated eight character SHA

##### Using a local directory

To use a local directory that contains the Puppet Editor services, use the `directory` configuration setting; for example if the the editor services was located in `C:\puppet-editor-services` use the following;

``` json
{
  "editor-services": {
    "directory": "C:\\puppet-editor-services"
  }
}
```

Note - Backslashes in the path must be escaped.

### Vendoring the resources into the extension

* Use psake to vendor the resources

```powershell
> ./build.ps1 -task clean,vendor
psake version 4.8.0
Copyright (c) 2010-2018 James Kovacs & Contributors

Executing clean
Executing VendorEditorServices
Executing VendorEditorSyntax

psake succeeded executing C:\Users\james\src\lingua\client\psakefile.ps1

----------------------------------------------------------------------
Build Time Report
----------------------------------------------------------------------
Name                 Duration
----                 --------
Clean                00:00:00.075
VendorEditorServices 00:00:01.601
VendorEditorSyntax   00:00:00.338
Vendor               00:00:00.000
Total:               00:00:02.023
```

* Start VS Code

```bash
> code .
```

* Once VS Code is running, press `F5` to start a build and a new VS Code development instance should start

* Open a Puppet file (.pp) and the client will start and connect to the Puppet Server

> Other Puppet VS Code extensions may cause issues with the development instance.  Ensure that you either uninstall or disable the other Puppet extensions prior.

## Issues

Please raise issues for the Language Server or Extension using the GitHub [issue tracker](https://github.com/puppetlabs/puppet-vscode/issues/new).
