# Puppet Language Support for Visual Studio Code

This extension provides Puppet Language support for [Visual Studio Code](https://code.visualstudio.com/)

## How to run the client and server for development

### Setup the client

* Ensure nodejs is installed

* Clone this repository

```bash
> git clone https://github.com/lingua-pupuli/puppet-vscode.git

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

### Vendor the Puppet Editor Services files

By default the extension will use the specified released version of the Puppet Editor Services.  The version is set in the `editor-services.json` file; for example, to use version `0.10.0` of the Editor Services;

``` json
{
  "release": "0.10.0"
}
```

To use a specific GitHub repository that contains the Puppet Editor services, use the `githubref` configuration setting; for example to use the `puppet-editing` repository, owned by `Alice` with the `testing` branch

``` json
{
  "githubuser": "Alice",
  "githubrepo": "puppet-editing",
  "githubref": "testing"
}
```

Note - By default the githubuser is `lingua-pupuli` and the githubrepo is `puppet-editor-services`

Note - Use the full length commit SHA for `githubref`, not the abbreviated eight character SHA

To use a local directory that contains the Puppet Editor services, use the `directory` configuration setting; for example if the the editor services was located in `C:\puppet-editor-services` use the following;

``` json
{
  "directory": "C:\\puppet-editor-services"
}
```

Note that backslashes in the path must be escaped.

* Vendor the Editor Services for vendoring into the extension

```bash
> node node_modules/gulp/bin/gulp.js clean vendor_editor_services
[20:44:22] Using gulpfile C:\Source\puppet-vscode\gulpfile.js
[20:44:22] Starting 'clean'...
[20:44:22] Starting 'vendor_editor_services'...
[20:44:22] Finished 'clean' after 92 ms
[20:44:26] Finished 'vendor_editor_services' after 4.35 s
```

* Start VS Code

```bash
> code .
```

* Once VS Code is running, press `F5` to start a build and a new VS Code development instance should start

* Open a Puppet file (.pp) and the client will start and connect to the Puppet Server

> Other Puppet VS Code extensions may cause issues with the development instance.  Ensure that you either uninstall or disable the other Puppet extensions prior.

## Issues

Please raise issues for the Language Server or Extension using the GitHub [issue tracker](https://github.com/lingua-pupuli/puppet-vscode/issues/new).
